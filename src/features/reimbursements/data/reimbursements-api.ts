import { api } from "@/core/network/api-client";

/** Mobile reimbursement claims — M-ESS-1 (receipt photo required, caps checked server-side). */

export const REIMBURSE_CATEGORIES = [
	"TRANSPORT",
	"KONSUMSI",
	"PARKIR",
	"TOL",
	"PENGINAPAN",
	"KESEHATAN",
	"DINAS",
	"LAINNYA",
] as const;

export type ReimbursementClaim = {
	id: string;
	number: string;
	category: string;
	amount: string;
	description: string;
	status: string;
};

export type ReimbursementInput = {
	category: string;
	receiptDate?: string;
	amount: number;
	description: string;
	attachmentUrl: string;
};

export function getMyReimbursements(signal?: AbortSignal): Promise<{ items: ReimbursementClaim[] }> {
	return api.get<{ items: ReimbursementClaim[] }>("/api/v1/reimbursements", { signal });
}

export function createReimbursement(input: ReimbursementInput): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/reimbursements", input);
}

export function updateReimbursementStatus(id: string, action: "submit" | "cancel"): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/reimbursements", { id, action });
}

export function getCategoryLabel(category: string): string {
	return category.charAt(0) + category.slice(1).toLowerCase();
}
