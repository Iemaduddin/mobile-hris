import { api } from "@/core/network/api-client";

/** Same-date shift swap — M-ESS-4 (requester → peer → HR). */

export type SwapItem = {
	id: string;
	date: string;
	peerName: string;
	direction: "outgoing" | "incoming";
	myShift: string;
	peerShift: string;
	status: string;
};

export type SwapPartner = { value: string; label: string };

export type SwapInput = {
	partnerEmployeeId: string;
	date: string;
	reason: string;
};

export function getMySwaps(signal?: AbortSignal): Promise<{ outgoing: SwapItem[]; incoming: SwapItem[] }> {
	return api.get<{ outgoing: SwapItem[]; incoming: SwapItem[] }>("/api/v1/tukar", { signal });
}

export function getSwapPartners(signal?: AbortSignal): Promise<{ items: SwapPartner[] }> {
	return api.get<{ items: SwapPartner[] }>("/api/v1/tukar?partner=1", { signal });
}

export function createSwap(input: SwapInput): Promise<{ id: string; message: string }> {
	return api.post<{ id: string; message: string }>("/api/v1/tukar", input);
}

export function updateSwapStatus(
	id: string,
	action: "submit" | "cancel" | "approve" | "reject",
	note?: string,
): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/tukar", { id, action, note });
}
