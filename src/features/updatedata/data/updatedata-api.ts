import { api } from "@/core/network/api-client";

/** Usulan update data mobile — M-ESS-5 (verifikasi HR). */

export const KATEGORI_UPDATE = ["ALAMAT", "KONTAK", "KELUARGA", "PENDIDIKAN", "DOKUMEN"] as const;

export const HUBUNGAN = ["PASANGAN", "ANAK", "ORANG_TUA", "SAUDARA", "LAINNYA"] as const;

export const GENDER = ["LAKI_LAKI", "PEREMPUAN"] as const;

export const GELAR = ["SD", "SMP", "SMA_SMK", "D1", "D2", "D3", "D4", "S1", "S2", "S3", "LAINNYA"] as const;

export const JENIS_DOKUMEN = [
	"KTP",
	"NPWP",
	"IJAZAH",
	"TRANSKRIP",
	"PAKLARING",
	"SERTIFIKAT",
	"KONTRAK_KERJA",
	"FOTO",
	"KARTU_KELUARGA",
	"BPJS_KESEHATAN",
	"BPJS_KETENAGAKERJAAN",
	"CV",
	"LAINNYA",
] as const;

export type UsulanUpdateData = {
	id: string;
	nomor: string;
	kategori: string;
	ringkasan: string;
	status: string;
	alasan: string;
	diajukanPada: string | null;
};

export type AnggotaKeluarga = { id: string; nama: string; hubungan: string };

export type InputUpdateData = {
	kategori: string;
	targetId?: string;
	dataBaru: Record<string, unknown>;
	alasan: string;
	lampiranUrl?: string;
};

export function getUpdateDataSaya(signal?: AbortSignal): Promise<{ items: UsulanUpdateData[] }> {
	return api.get<{ items: UsulanUpdateData[] }>("/api/v1/update-data", { signal });
}

export function getKeluargaSaya(signal?: AbortSignal): Promise<{ items: AnggotaKeluarga[] }> {
	return api.get<{ items: AnggotaKeluarga[] }>("/api/v1/update-data?keluarga=1", { signal });
}

export function buatUpdateData(input: InputUpdateData): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/update-data", input);
}

export function ubahStatusUpdateData(id: string, aksi: "ajukan" | "batal"): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/update-data", { id, aksi });
}

const LABEL_KATEGORI: Record<string, string> = {
	ALAMAT: "Alamat",
	KONTAK: "Kontak",
	KELUARGA: "Keluarga",
	PENDIDIKAN: "Pendidikan",
	DOKUMEN: "Dokumen",
};

export function labelKategoriUpdate(kategori: string): string {
	return LABEL_KATEGORI[kategori] ?? kategori;
}
