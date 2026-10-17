import { api } from "@/core/network/api-client";

/** Mobile data-update proposals — M-ESS-5 (HR verification). */

export const UPDATE_CATEGORIES = ["ALAMAT", "KONTAK", "KELUARGA", "PENDIDIKAN", "DOKUMEN"] as const;

export const RELATIONSHIPS = ["PASANGAN", "ANAK", "ORANG_TUA", "SAUDARA", "LAINNYA"] as const;

export const GENDERS = ["LAKI_LAKI", "PEREMPUAN"] as const;

export const DEGREES = ["SD", "SMP", "SMA_SMK", "D1", "D2", "D3", "D4", "S1", "S2", "S3", "LAINNYA"] as const;

export const DOCUMENT_TYPES = [
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

export type DataUpdateProposal = {
	id: string;
	number: string;
	category: string;
	summary: string;
	status: string;
	reason: string;
	submittedAt: string | null;
};

export type FamilyMember = { id: string; name: string; relation: string };

export type DataUpdateInput = {
	category: string;
	targetId?: string;
	newData: Record<string, unknown>;
	reason: string;
	attachmentUrl?: string;
};

export function getMyDataUpdates(signal?: AbortSignal): Promise<{ items: DataUpdateProposal[] }> {
	return api.get<{ items: DataUpdateProposal[] }>("/api/v1/update-data", { signal });
}

export function getMyFamily(signal?: AbortSignal): Promise<{ items: FamilyMember[] }> {
	return api.get<{ items: FamilyMember[] }>("/api/v1/update-data?family=1", { signal });
}

export function createDataUpdate(input: DataUpdateInput): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/update-data", input);
}

export function updateDataUpdateStatus(id: string, action: "submit" | "cancel"): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/update-data", { id, action });
}

const CATEGORY_LABELS: Record<string, string> = {
	ALAMAT: "Alamat",
	KONTAK: "Kontak",
	KELUARGA: "Keluarga",
	PENDIDIKAN: "Pendidikan",
	DOKUMEN: "Dokumen",
};

export function getUpdateCategoryLabel(category: string): string {
	return CATEGORY_LABELS[category] ?? category;
}
