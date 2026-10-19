import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCorrection, getMyCorrections, updateCorrectionStatus, type CorrectionInput } from "../data/corrections-api";

export const correctionKeys = {
	all: ["corrections"] as const,
	list: () => [...correctionKeys.all, "list"] as const,
};

/** Owned correction list. */
export function useMyCorrections() {
	return useQuery({
		queryKey: correctionKeys.list(),
		queryFn: ({ signal }) => getMyCorrections(signal),
		select: (data) => data.items,
	});
}

/** Create a correction draft. */
export function useCreateCorrection() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CorrectionInput) => createCorrection(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: correctionKeys.all });
		},
	});
}

/** Submit / cancel a correction. */
export function useCorrectionAction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, action }: { id: string; action: "submit" | "cancel" }) => updateCorrectionStatus(id, action),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: correctionKeys.all });
		},
	});
}
