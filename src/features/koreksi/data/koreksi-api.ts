import { api } from "@/core/network/api-client";

/** Self-service attendance correction — M-ESS-3 (via lead → HR approval). */

export const CORRECTION_TYPES = [
	"MASUK",
	"KELUAR",
	"MULAI_ISTIRAHAT",
	"SELESAI_ISTIRAHAT",
	"KELUAR_KANTOR",
	"KEMBALI_KANTOR",
] as const;

export type MyCorrection = {
	id: string;
	date: string;
	eventType: string;
	correctedTime: string;
	reason: string;
	status: string;
};

export type CorrectionInput = {
	date: string;
	eventType: string;
	time: string;
	reason: string;
	attachmentUrl: string;
};

export function getMyCorrections(signal?: AbortSignal): Promise<{ items: MyCorrection[] }> {
	return api.get<{ items: MyCorrection[] }>("/api/v1/koreksi", { signal });
}

export function createCorrection(input: CorrectionInput): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/koreksi", input);
}

export function updateCorrectionStatus(id: string, action: "submit" | "cancel"): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/koreksi", { id, action });
}

export function getCorrectionTypeLabel(eventType: string): string {
	return eventType.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}
