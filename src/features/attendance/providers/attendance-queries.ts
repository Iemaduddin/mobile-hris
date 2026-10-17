import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiException } from "@/core/network/api-exception";
import { getDeviceInfo } from "@/core/device/device-info";
import { getPosition } from "@/core/location/location-service";
import { myWorkLocation } from "@/features/auth/models/session";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { getDayDetail, getMonthlyHistory, getTodayStatus, recordAttendance } from "../data/attendance-api";
import type { AttendanceInput, AttendanceEventType, ClockResult } from "../models/attendance";

export const attendanceKeys = {
	all: ["attendance"] as const,
	status: () => [...attendanceKeys.all, "status"] as const,
	history: (year: number, month: number) =>
		[...attendanceKeys.all, "history", year, month] as const,
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
	| { status: "cancelled" }
	| { status: "failed"; message: string };

type ClockOptions = {
	/**
	 * Called when the device reports a mocked GPS fix.
	 * Return `false` to cancel sending (mobile PRD Bag. 5.3.A item 2).
	 */
	confirmMockGps: () => Promise<boolean>;
};

/**
 * Clock-in/out flow: grab GPS → detect mock → confirm → POST.
 * Attendance always goes through even without coordinates (PRD: coordinates optional);
 * only `isMocked`/`isOutsideRadius` get flagged by the server.
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
			setPhase("fetching_location");
			const result = await getPosition();
			const position = result.ok ? result.position : null;
			const locationWarning = result.ok ? null : getLocationUnavailableMessage(result.reason);

			if (position?.isMocked) {
				const proceed = await options.confirmMockGps();
				if (!proceed) {
					setPhase("idle");
					return { status: "cancelled" };
				}
			}

			setPhase("sending");
			try {
				const device = await getDeviceInfo();
				const workplace = myWorkLocation(employee);

				const data = await mutation.mutateAsync({
					eventType,
					deviceId: device.deviceId,
					deviceName: device.deviceName,
					platform: device.platform,
					latitude: position?.latitude,
					longitude: position?.longitude,
					isMocked: position?.isMocked ?? false,
					workLocationId: workplace?.id,
				});

				return { status: "recorded", data, locationWarning };
			} catch (error) {
				return {
					status: "failed",
					message: error instanceof ApiException ? error.message : "Gagal mengirim presensi.",
				};
			} finally {
				setPhase("idle");
			}
		},
		[employee, mutation],
	);

	return { clock, phase, isSending: mutation.isPending, reset: mutation.reset };
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
