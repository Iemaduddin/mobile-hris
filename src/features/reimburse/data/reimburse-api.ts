import { api } from "@/core/network/api-client";

/** Klaim reimbursement mobile — M-ESS-1 (foto struk wajib, plafon di server). */

export const KATEGORI_REIMBURSE = [
	"TRANSPORT",
	"KONSUMSI",
	"PARKIR",
	"TOL",
	"PENGINAPAN",
	"KESEHATAN",
	"DINAS",
	"LAINNYA",
] as const;

export type KlaimReimburse = {
	id: string;
	nomor: string;
	kategori: string;
	nominal: string;
	keterangan: string;
	status: string;
};

export type InputReimburse = {
	kategori: string;
	tanggalKwitansi?: string;
	nominal: number;
	keterangan: string;
	lampiranUrl: string;
};

export function getReimburseSaya(signal?: AbortSignal): Promise<{ items: KlaimReimburse[] }> {
	return api.get<{ items: KlaimReimburse[] }>("/api/v1/reimburse", { signal });
}

export function buatReimburse(input: InputReimburse): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/reimburse", input);
}

export function ubahStatusReimburse(id: string, aksi: "ajukan" | "batal"): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/reimburse", { id, aksi });
}

export function labelKategori(kategori: string): string {
	return kategori.charAt(0) + kategori.slice(1).toLowerCase();
}

export function formatNominal(nominal: string | number): string {
	const n = typeof nominal === "number" ? nominal : Number(nominal);
	if (!Number.isFinite(n)) return "Rp0";
	return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}
