import { api } from "@/core/network/api-client";

/**
 * Manager approval inbox — P4-4 (read-only master/payroll: only
 * approve/reject + note; per-stage authorization enforced server-side).
 */

export type ApprovalInboxItem = {
	type: string;
	id: string;
	number: string;
	employeeId: string;
	employeeName: string;
	employeeNumber: string;
	summary: string;
	date: string | null;
	amount: number | null;
	stage: number;
	submittedAt: string | null;
};

export type DecisionResult = { message: string };

const TYPE_LABELS: Record<string, string> = {
	CUTI: "Cuti/Izin",
	LEMBUR: "Lembur",
	DINAS: "Dinas/WFH",
	MUTASI: "Mutasi",
	RESIGN: "Resign",
	PROBATION: "Probation",
	TUKAR_SHIFT: "Tukar Shift",
	KOREKSI: "Koreksi Presensi",
	REIMBURSE: "Reimbursement",
	UANGDINAS: "Uang Dinas",
	KASBON: "SalaryAdvance",
};

export function getApprovalTypeLabel(type: string): string {
	return TYPE_LABELS[type] ?? type;
}

export function getApprovalInbox(signal?: AbortSignal): Promise<{ count: number; items: ApprovalInboxItem[] }> {
	return api.get<{ count: number; items: ApprovalInboxItem[] }>("/api/v1/approval", { signal });
}

export function decideApproval(
	type: string,
	id: string,
	decision: "SETUJU" | "TOLAK",
	note?: string,
): Promise<DecisionResult> {
	return api.post<DecisionResult>("/api/v1/approval", { type, id, decision, note });
}
