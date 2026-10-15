import { api } from "@/core/network/api-client";

/** Kasbon / pinjaman karyawan mobile — M-ESS-2 (potong otomatis via salary run). */

export type KasbonSaya = {
	id: string;
	nomor: string;
	nominal: string;
	tenorBulan: number;
	angsuranPerBulan: string;
	sisaHutang: string;
	mulaiPotong: string;
	alasan: string;
	status: string;
	angsuranKe: number;
	catatan: string | null;
};

export type InputKasbon = {
	nominal: number;
	tenorBulan: number;
	mulaiPotong: string;
	alasan: string;
};

export function getKasbonSaya(signal?: AbortSignal): Promise<{ items: KasbonSaya[] }> {
	return api.get<{ items: KasbonSaya[] }>("/api/v1/kasbon", { signal });
}

export function buatKasbon(input: InputKasbon): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/kasbon", input);
}

export function ubahStatusKasbon(id: string, aksi: "ajukan" | "batal"): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/kasbon", { id, aksi });
}

export function formatRupiahKasbon(nominal: string | number): string {
	const n = typeof nominal === "number" ? nominal : Number(nominal);
	if (!Number.isFinite(n)) return "Rp0";
	return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

/** Estimasi angsuran per bulan (pembulatan ke atas). */
export function estimasiAngsuran(nominal: number, tenorBulan: number): number {
	if (!Number.isFinite(nominal) || nominal <= 0 || !Number.isFinite(tenorBulan) || tenorBulan < 1) return 0;
	return Math.ceil(nominal / Math.floor(tenorBulan));
}
