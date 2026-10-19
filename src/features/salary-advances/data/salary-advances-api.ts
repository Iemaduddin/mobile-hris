import { api } from "@/core/network/api-client";

/** Employee salary advances — M-ESS-2 (auto-deducted via salary runs). */

export type MySalaryAdvance = {
	id: string;
	number: string;
	amount: string;
	tenorMonths: number;
	monthlyInstallment: string;
	remainingDebt: string;
	deductionStart: string;
	reason: string;
	status: string;
	installmentNo: number;
	note: string | null;
};

export type SalaryAdvanceInput = {
	amount: number;
	tenorMonths: number;
	deductionStart: string;
	reason: string;
};

export function getMySalaryAdvances(signal?: AbortSignal): Promise<{ items: MySalaryAdvance[] }> {
	return api.get<{ items: MySalaryAdvance[] }>("/api/v1/salary-advances", { signal });
}

export function createSalaryAdvance(input: SalaryAdvanceInput): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/salary-advances", input);
}

export function updateSalaryAdvanceStatus(id: string, action: "submit" | "cancel"): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/salary-advances", { id, action });
}

/** Estimated monthly installment (rounded up). */
export function estimateInstallment(amount: number, tenorMonths: number): number {
	if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(tenorMonths) || tenorMonths < 1) return 0;
	return Math.ceil(amount / Math.floor(tenorMonths));
}
