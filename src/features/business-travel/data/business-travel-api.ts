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

export type BusinessTravelInput = {
	dutyId: string;
	advanceAmount: number;
	purpose: string;
};

export function getMyUangDinas(signal?: AbortSignal): Promise<{ items: MyUangDinas[] }> {
	return api.get<{ items: MyUangDinas[] }>("/api/v1/business-travel", { signal });
}

export function getDutyOptions(signal?: AbortSignal): Promise<{ items: DutyOption[] }> {
	return api.get<{ items: DutyOption[] }>("/api/v1/business-travel?duty=1", { signal });
}

export function createBusinessTravel(input: BusinessTravelInput): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/business-travel", input);
}

export function updateUangDinasStatus(
	id: string,
	action: "submit" | "cancel" | "report",
	extra?: { actualTotal?: number; attachmentUrl?: string },
): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/business-travel", { id, action, ...extra });
}
