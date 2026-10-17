import { api } from "@/core/network/api-client";

/** Employee onboarding checklist — M-ESS-7 (self tick-off; verification stays on web). */

export type MyOnboarding = {
	id: string;
	number: string;
	employeeName: string;
	templateName: string | null;
	status: string;
	targetDate: string | null;
	percent: number;
	requiredDone: string;
};

export type OnboardingChecklistItem = {
	id: string;
	title: string;
	category: string;
	required: boolean;
	status: string;
	note: string | null;
	completedAt: string | null;
	verifiedAt: string | null;
};

export type OnboardingDetail = {
	id: string;
	employeeId: string;
	employeeName: string;
	templateName: string | null;
	status: string;
	startDate: string;
	targetDate: string | null;
	completedAt: string | null;
	percent: number;
	canComplete: boolean;
	items: OnboardingChecklistItem[];
};

export function getMyOnboarding(signal?: AbortSignal): Promise<{ items: MyOnboarding[] }> {
	return api.get<{ items: MyOnboarding[] }>("/api/v1/onboarding", { signal });
}

export function getOnboardingDetail(
	id: string,
	signal?: AbortSignal,
): Promise<{ onboarding: OnboardingDetail }> {
	return api.get<{ onboarding: OnboardingDetail }>(
		`/api/v1/onboarding?id=${encodeURIComponent(id)}`,
		{ signal },
	);
}

export function toggleChecklistItem(
	itemId: string,
	action: "done" | "undo",
): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/onboarding", { itemId, action });
}
