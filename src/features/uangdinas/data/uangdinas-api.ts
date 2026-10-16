import { api } from "@/core/network/api-client";

/** Travel advances + settlement reports — M-ESS-6 (advance from approved duty, receipt photo required). */

export type MyUangDinas = {
	id: string;
	number: string;
	dutyNumber: string;
	advanceAmount: string;
	status: string;
	difference: string | null;
};

export type DutyOption = {
	value: string;
	label: string;
};

export type UangDinasInput = {
	dutyId: string;
	advanceAmount: number;
	purpose: string;
};

export function getMyUangDinas(signal?: AbortSignal): Promise<{ items: MyUangDinas[] }> {
	return api.get<{ items: MyUangDinas[] }>("/api/v1/uang-dinas", { signal });
}

export function getDutyOptions(signal?: AbortSignal): Promise<{ items: DutyOption[] }> {
	return api.get<{ items: DutyOption[] }>("/api/v1/uang-dinas?duty=1", { signal });
}

export function createUangDinas(input: UangDinasInput): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/uang-dinas", input);
}

export function updateUangDinasStatus(
	id: string,
	action: "submit" | "cancel" | "report",
	extra?: { actualTotal?: number; attachmentUrl?: string },
): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/uang-dinas", { id, action, ...extra });
}
