import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiException } from "@/core/network/api-exception";
import { ambilPerangkatInfo } from "@/core/device/device-info";
import { ambilPosisi } from "@/core/location/location-service";
import { lokasiKerjaSaya } from "@/features/auth/models/session";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { catatPresensi, getDetailHari, getRiwayatBulanan, getStatusHariIni } from "../data/attendance-api";
import type { HasilClock, InputPresensi, TipePresensi } from "../models/attendance";

export const presensiKeys = {
	all: ["presensi"] as const,
	status: () => [...presensiKeys.all, "status"] as const,
	riwayat: (tahun: number, bulan: number) =>
		[...presensiKeys.all, "riwayat", tahun, bulan] as const,
};

export function useStatusHariIni() {
	return useQuery({
		queryKey: presensiKeys.status(),
		queryFn: ({ signal }) => getStatusHariIni(signal),
	});
}

export function useRiwayatBulanan(tahun: number, bulan: number) {
	return useQuery({
		queryKey: presensiKeys.riwayat(tahun, bulan),
		queryFn: ({ signal }) => getRiwayatBulanan(tahun, bulan, signal),
	});
}

export function useDetailHari(tanggal: string) {
	return useQuery({
		queryKey: [...presensiKeys.all, "hari", tanggal],
		queryFn: ({ signal }) => getDetailHari(tanggal, signal),
		enabled: tanggal.length === 10,
	});
}

export type FaseClock = "idle" | "mengambil_lokasi" | "mengirim";

/** Hasil akhir satu aksi clock-in/out. */
export type HasilAksi =
	| {
			status: "tercatat";
			data: HasilClock;
			/** Peringatan GPS tidak tersedia (presensi tetap terkirim tanpa koordinat). */
			peringatanLokasi: string | null;
	  }
	| { status: "dibatalkan" }
	| { status: "gagal"; pesan: string };

type ClockOptions = {
	/**
	 * Dipanggil saat perangkat melaporkan GPS simulasi.
	 * Return `false` untuk membatalkan pengiriman (PRD mobile Bag. 5.3.A but.2).
	 */
	konfirmasiGpsPalsu: () => Promise<boolean>;
};

/**
 * Alur clock-in/out: ambil GPS → deteksi mock → konfirmasi → POST.
 * Presensi selalu diteruskan walau tanpa koordinat (PRD: koordinat opsional);
 * hanya `isMocked`/`diLuarRadius` yang akan ditandai oleh server.
 */
export function useClock() {
	const queryClient = useQueryClient();
	const karyawan = useAuthStore((s) => s.karyawan);
	const [fase, setFase] = useState<FaseClock>("idle");

	const mutation = useMutation({
		mutationFn: (input: InputPresensi) => catatPresensi(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: presensiKeys.all });
		},
		onSettled: () => setFase("idle"),
	});

	const clock = useCallback(
		async (tipe: TipePresensi, options: ClockOptions): Promise<HasilAksi> => {
			setFase("mengambil_lokasi");
			const hasil = await ambilPosisi();
			const posisi = hasil.ok ? hasil.posisi : null;
			const peringatanLokasi = hasil.ok ? null : pesanLokasiTidakTersedia(hasil.reason);

			if (posisi?.isMocked) {
				const lanjut = await options.konfirmasiGpsPalsu();
				if (!lanjut) {
					setFase("idle");
					return { status: "dibatalkan" };
				}
			}

			setFase("mengirim");
			try {
				const perangkat = await ambilPerangkatInfo();
				const lokasi = lokasiKerjaSaya(karyawan);

				const data = await mutation.mutateAsync({
					tipe,
					deviceId: perangkat.deviceId,
					deviceName: perangkat.deviceName,
					platform: perangkat.platform,
					latitude: posisi?.latitude,
					longitude: posisi?.longitude,
					isMocked: posisi?.isMocked ?? false,
					lokasiKerjaId: lokasi?.id,
				});

				return { status: "tercatat", data, peringatanLokasi };
			} catch (error) {
				return {
					status: "gagal",
					pesan: error instanceof ApiException ? error.message : "Gagal mengirim presensi.",
				};
			} finally {
				setFase("idle");
			}
		},
		[karyawan, mutation],
	);

	return { clock, fase, isSending: mutation.isPending, reset: mutation.reset };
}

function pesanLokasiTidakTersedia(
	reason: "LAYANAN_NONAKTIF" | "IZIN_DITOLAK" | "TIDAK_TERSEDIA",
): string {
	switch (reason) {
		case "LAYANAN_NONAKTIF":
			return "Layanan lokasi nonaktif — presensi dikirim tanpa koordinat.";
		case "IZIN_DITOLAK":
			return "Izin lokasi ditolak — presensi dikirim tanpa koordinat.";
		case "TIDAK_TERSEDIA":
			return "Lokasi belum didapatkan — presensi dikirim tanpa koordinat.";
	}
}
