import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createBusinessTravel,
	getDutyOptions,
	getMyUangDinas,
	updateUangDinasStatus,
	type BusinessTravelInput,
} from "../data/business-travel-api";

export const travelAdvanceKeys = {
	all: ["travel-advances"] as const,
	list: () => [...travelAdvanceKeys.all, "list"] as const,
	duty: () => [...travelAdvanceKeys.all, "duty"] as const,
};

/** Owned travel advance list. */
export function useMyUangDinas() {
	return useQuery({
		queryKey: travelAdvanceKeys.list(),
		queryFn: ({ signal }) => getMyUangDinas(signal),
		select: (data) => data.items,
	});
}

/** Approved duty options without an advance yet. */
export function useDutyOptions() {
	return useQuery({
		queryKey: travelAdvanceKeys.duty(),
		queryFn: ({ signal }) => getDutyOptions(signal),
		select: (data) => data.items,
	});
}

/** Create an advance draft. */
export function useCreateUangDinas() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: BusinessTravelInput) => createBusinessTravel(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: travelAdvanceKeys.all });
		},
	});
}

/** Submit / cancel / report actuals. */
export function useUangDinasAction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			action,
			actualTotal,
			attachmentUrl,
		}: {
			id: string;
			action: "submit" | "cancel" | "report";
			actualTotal?: number;
			attachmentUrl?: string;
		}) => updateUangDinasStatus(id, action, { actualTotal, attachmentUrl }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: travelAdvanceKeys.all });
		},
	});
}
