import { api } from "@/core/network/api-client";
import type {
	DetailHari,
	HasilClock,
	InputPresensi,
	RiwayatBulanan,
	StatusPresensiHariIni,
} from "../models/attendance";

/**
 * Endpoint presensi mobile — PRD mobile Bag. 6 no.6-8.
 * `deviceId`/`platform` ditempel otomatis oleh pemanggil (lihat useClock).
 */

export function getStatusHariIni(signal?: AbortSignal): Promise<StatusPresensiHariIni> {
	return api.get<StatusPresensiHariIni>("/api/v1/attendance", { signal });
}

export function catatPresensi(input: InputPresensi): Promise<HasilClock> {
	return api.post<HasilClock>("/api/v1/attendance", input);
}

export function getRiwayatBulanan(
	tahun: number,
	bulan: number,
	signal?: AbortSignal,
): Promise<RiwayatBulanan> {
	const query = `?tahun=${tahun}&bulan=${bulan}`;
	return api.get<RiwayatBulanan>(`/api/v1/attendance/history${query}`, { signal });
}

/** Detail satu hari (rekap + daftar event) — PRD mobile Bag. 5.3.C. */
export function getDetailHari(tanggal: string, signal?: AbortSignal): Promise<DetailHari> {
	return api.get<DetailHari>(`/api/v1/attendance/day?tanggal=${tanggal}`, { signal });
}
