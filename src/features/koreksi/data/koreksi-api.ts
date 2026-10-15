import { api } from "@/core/network/api-client";

/** Koreksi presensi mandiri mobile — M-ESS-3 (via approval atasan → HR). */

export const TIPE_KOREKSI = [
	"MASUK",
	"KELUAR",
	"MULAI_ISTIRAHAT",
	"SELESAI_ISTIRAHAT",
	"KELUAR_KANTOR",
	"KEMBALI_KANTOR",
] as const;

export type KoreksiSaya = {
	id: string;
	tanggal: string;
	tipe: string;
	waktuBaru: string;
	alasan: string;
	status: string;
};

export type InputKoreksi = {
	tanggal: string;
	tipe: string;
	jam: string;
	alasan: string;
	lampiranUrl: string;
};

export function getKoreksiSaya(signal?: AbortSignal): Promise<{ items: KoreksiSaya[] }> {
	return api.get<{ items: KoreksiSaya[] }>("/api/v1/koreksi", { signal });
}

export function buatKoreksi(input: InputKoreksi): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/koreksi", input);
}

export function ubahStatusKoreksi(id: string, aksi: "ajukan" | "batal"): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/koreksi", { id, aksi });
}

export function labelTipeKoreksi(tipe: string): string {
	return tipe.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}
