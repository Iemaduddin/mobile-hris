import { api } from "@/core/network/api-client";

/** Tukar shift same-date mobile — M-ESS-4 (pemohon → pasangan → HR). */

export type TukarItem = {
	id: string;
	tanggal: string;
	lawanNama: string;
	arah: "keluar" | "masuk";
	shiftSaya: string;
	shiftLawan: string;
	status: string;
};

export type PasanganTukar = { value: string; label: string };

export type InputTukar = {
	pasanganKaryawanId: string;
	tanggal: string;
	alasan: string;
};

export function getTukarSaya(signal?: AbortSignal): Promise<{ keluar: TukarItem[]; masuk: TukarItem[] }> {
	return api.get<{ keluar: TukarItem[]; masuk: TukarItem[] }>("/api/v1/tukar", { signal });
}

export function getPasanganTukar(signal?: AbortSignal): Promise<{ items: PasanganTukar[] }> {
	return api.get<{ items: PasanganTukar[] }>("/api/v1/tukar?pasangan=1", { signal });
}

export function buatTukar(input: InputTukar): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/tukar", input);
}

export function ubahStatusTukar(
	id: string,
	aksi: "ajukan" | "batal" | "setuju" | "tolak",
	catatan?: string,
): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/tukar", { id, aksi, catatan });
}
