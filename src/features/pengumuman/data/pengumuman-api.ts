import { api } from "@/core/network/api-client";

/** Pengumuman perusahaan + peristiwa minggu ini (ultah/anniversary). */

export type PengumumanMobile = {
	id: string;
	judul: string;
	isi: string;
	unitNama: string | null;
	tayangMulai: string;
	tayangSelesai: string | null;
};

export type PeristiwaMobile = {
	namaLengkap: string;
	nomorKaryawan: string;
	jenis: "ULTAH" | "ANNIV";
	tanggal: string;
	info: string;
};

export type ResponsPengumuman = { items: PengumumanMobile[]; peristiwa: PeristiwaMobile[] };

export function getPengumuman(signal?: AbortSignal): Promise<ResponsPengumuman> {
	return api.get<ResponsPengumuman>("/api/v1/pengumuman", { signal });
}
