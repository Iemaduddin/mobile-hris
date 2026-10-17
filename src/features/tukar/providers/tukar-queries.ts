import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createSwap,
	getMySwaps,
	getSwapPartners,
	updateSwapStatus,
	type SwapInput,
} from "../data/tukar-api";

export const swapKeys = {
	all: ["swaps"] as const,
	list: () => [...swapKeys.all, "list"] as const,
	partners: () => [...swapKeys.all, "partners"] as const,
};

/** Outgoing + incoming swaps for me. */
export function useMySwaps() {
	return useQuery({
		queryKey: swapKeys.list(),
		queryFn: ({ signal }) => getMySwaps(signal),
	});
}

/** Partner options (all active employees except me). */
export function useSwapPartners() {
	return useQuery({
		queryKey: swapKeys.partners(),
		queryFn: ({ signal }) => getSwapPartners(signal),
		select: (data) => data.items,
	});
}

/** Create a swap draft. */
export function useCreateSwap() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: SwapInput) => createSwap(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: swapKeys.all });
		},
	});
}

/** Submit / cancel / approve / reject. */
export function useSwapAction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			action,
			note,
		}: {
			id: string;
			action: "submit" | "cancel" | "approve" | "reject";
			note?: string;
		}) => updateSwapStatus(id, action, note),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: swapKeys.all });
		},
	});
}
