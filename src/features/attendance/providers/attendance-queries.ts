import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiException, NetworkException } from "@/core/network/api-exception";
import { getDeviceInfo } from "@/core/device/device-info";
import {
	detectLocationAnomaly,
	getLocationAnomalyMessage,
	getPosition,
	type LocationAnomaly,
} from "@/core/location/location-service";
import { myWorkLocation } from "@/features/auth/models/session";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { getDayDetail, getMonthlyHistory, getTodayStatus, recordAttendance } from "../data/attendance-api";
import { attendanceQueue, type QueuedClock } from "../data/offline-queue";
import type { AttendanceInput, AttendanceEventType, ClockResult } from "../models/attendance";

export const attendanceKeys = {
	all: ["attendance"] as const,
	status: () => [...attendanceKeys.all, "status"] as const,
	history: (year: number, month: number) =>
		[...attendanceKeys.all, "history", year, month] as const,
	queue: () => [...attendanceKeys.all, "queue"] as const,
};

export function useTodayStatus() {
	return useQuery({
		queryKey: attendanceKeys.status(),
		queryFn: ({ signal }) => getTodayStatus(signal),
	});
}

export function useMonthlyHistory(year: number, month: number) {
	return useQuery({
		queryKey: attendanceKeys.history(year, month),
		queryFn: ({ signal }) => getMonthlyHistory(year, month, signal),
	});
}

export function useDayDetail(date: string) {
	return useQuery({
		queryKey: [...attendanceKeys.all, "day", date],
		queryFn: ({ signal }) => getDayDetail(date, signal),
		enabled: date.length === 10,
	});
}

export type ClockPhase = "idle" | "fetching_location" | "sending";

/** Final outcome of one clock-in/out action. */
export type ClockActionResult =
	| {
			status: "recorded";
			data: ClockResult;
			/** GPS-unavailable warning (attendance still sent without coordinates). */
			locationWarning: string | null;
	  }
	/** P6-5 — server unreachable; event stored locally and will be replayed. */
	| { status: "queued"; pending: number }
	| { status: "cancelled" }
	| { status: "failed"; message: string };

type ClockOptions = {
	/**
	 * Called when the location is reported/suspected as mocked (mobile PRD Bag. 5.3.A item 2).
	 * Return `false` to cancel sending.
	 */
	confirmMockGps: (anomaly: LocationAnomaly) => Promise<boolean>;
};

/**
 * Clock-in/out flow: grab GPS → detect anomaly → confirm → POST.
 * Attendance always goes through even without coordinates (PRD: coordinates optional);
 * only `isMocked`/`isOutsideRadius` get flagged by the server.
 * P6-5: when the device is offline the event is queued instead of lost.
 */
export function useClock() {
	const queryClient = useQueryClient();
	const employee = useAuthStore((s) => s.employee);
	const [phase, setPhase] = useState<ClockPhase>("idle");

	const mutation = useMutation({
		mutationFn: (input: AttendanceInput) => recordAttendance(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
		},
		onSettled: () => setPhase("idle"),
	});

	const clock = useCallback(
		async (eventType: AttendanceEventType, options: ClockOptions): Promise<ClockActionResult> => {
			// Waktu kejadian diambil saat tombol ditekan, bukan setelah GPS/kirim
			// selesai — supaya jam presensi jujur walau dikirim lewat antrean offline.
			const eventTime = new Date().toISOString();

			setPhase("fetching_location");
			const result = await getPosition();
			const position = result.ok ? result.position : null;
			const locationWarning = result.ok ? null : getLocationUnavailableMessage(result.reason);

			const anomaly = detectLocationAnomaly(position);
			if (anomaly.suspectedMock && anomaly.reason) {
				const proceed = await options.confirmMockGps(anomaly);
				if (!proceed) {
					setPhase("idle");
					return { status: "cancelled" };
				}
			}

			// Payload dibangun sekali dan dipakai untuk kirim langsung maupun
			// antrean: identitas perangkat dibaca lokal, jadi tetap lengkap offline.
			const device = await getDeviceInfo();
			const workplace = myWorkLocation(employee);
			const input: AttendanceInput = {
				eventType,
				time: eventTime,
				deviceId: device.deviceId,
				deviceName: device.deviceName,
				platform: device.platform,
				latitude: position?.latitude,
				longitude: position?.longitude,
				isMocked: anomaly.suspectedMock,
				note: anomaly.reason ? getLocationAnomalyMessage(anomaly.reason) : undefined,
				workLocationId: workplace?.id,
			};

			setPhase("sending");
			try {
				const data = await mutation.mutateAsync(input);

				return { status: "recorded", data, locationWarning };
			} catch (error) {
				// Offline (tak ada koneksi/timeout) → simpan ke antrean perangkat.
				if (error instanceof NetworkException && employee?.id) {
					const queued = await attendanceQueue.enqueue({ employeeId: employee.id, input });
					void queryClient.invalidateQueries({ queryKey: attendanceKeys.queue() });
					return { status: "queued", pending: queued.length };
				}

				return {
					status: "failed",
					message: error instanceof ApiException ? error.message : "Gagal mengirim presensi.",
				};
			} finally {
				setPhase("idle");
			}
		},
		[employee, mutation, queryClient],
	);

	return { clock, phase, isSending: mutation.isPending, reset: mutation.reset };
}

export type QueueFlushResult = {
	/** Events accepted by the server this round. */
	sent: number;
	/** Events still waiting on the device. */
	remaining: number;
	/** Message when an event was rejected / the retry must stop. */
	error: string | null;
};

/**
 * P6-5 — presensi offline yang menunggu koneksi.
 * `flush()` mengirim ulang antrean berurutan; item yang ditolak server (4xx)
 * dibuang agar antrean tidak macet, sementara kegagalan jaringan menghentikan
 * percobaan sampai kesempatan berikutnya.
 */
export function useAttendanceQueue() {
	const queryClient = useQueryClient();
	const employee = useAuthStore((s) => s.employee);
	const [isFlushing, setIsFlushing] = useState(false);

	const { data: pending = 0 } = useQuery({
		queryKey: attendanceKeys.queue(),
		queryFn: () => attendanceQueue.list(),
		select: (items) => items.length,
	});

	/** Baca ulang antrean dari perangkat (tanpa cache) — dipakai saat kirim ulang. */
	const refresh = useCallback(async () => {
		const items = await queryClient.fetchQuery({
			queryKey: attendanceKeys.queue(),
			queryFn: () => attendanceQueue.list(),
		});
		return items.length;
	}, [queryClient]);

	const flush = useCallback(async (): Promise<QueueFlushResult> => {
		const karyawanId = employee?.id ?? null;
		const items: QueuedClock[] = await attendanceQueue.list();
		if (items.length === 0) {
			void queryClient.invalidateQueries({ queryKey: attendanceKeys.queue() });
			return { sent: 0, remaining: 0, error: null };
		}
		if (!karyawanId) {
			return { sent: 0, remaining: items.length, error: null };
		}

		setIsFlushing(true);
		let sent = 0;
		let error: string | null = null;
		try {
			for (const item of items) {
				// Antrean milik karyawan lain (mis. setelah ganti akun) tidak dikirim.
				if (item.employeeId !== karyawanId) {
					await attendanceQueue.remove(item.id);
					continue;
				}
				try {
					await recordAttendance(item.input);
					await attendanceQueue.remove(item.id);
					sent += 1;
				} catch (failure) {
					if (failure instanceof NetworkException) break; // masih offline
					if (failure instanceof ApiException && (failure.status === 401 || failure.status === 429)) {
						error = failure.message;
						break;
					}
					// Ditolak server (validasi) → tidak akan pernah diterima.
					await attendanceQueue.remove(item.id);
					error =
						failure instanceof ApiException ? failure.message : "Presensi antrean ditolak server.";
				}
			}
			if (sent > 0) void queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
		} finally {
			const remaining = await refresh();
			setIsFlushing(false);
			return { sent, remaining, error };
		}
	}, [employee?.id, queryClient, refresh]);

	return { pending, isFlushing, flush, refresh };
}

function getLocationUnavailableMessage(
	reason: "SERVICE_OFF" | "PERMISSION_DENIED" | "UNAVAILABLE",
): string {
	switch (reason) {
		case "SERVICE_OFF":
			return "Layanan lokasi nonaktif — presensi dikirim tanpa koordinat.";
		case "PERMISSION_DENIED":
			return "Izin lokasi ditolak — presensi dikirim tanpa koordinat.";
		case "UNAVAILABLE":
			return "Lokasi belum didapatkan — presensi dikirim tanpa koordinat.";
	}
}
