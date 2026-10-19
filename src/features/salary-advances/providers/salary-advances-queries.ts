import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSalaryAdvance, getMySalaryAdvances, updateSalaryAdvanceStatus, type SalaryAdvanceInput } from "../data/salary-advances-api";

export const salaryAdvanceKeys = {
	all: ["salary-advances"] as const,
	list: () => [...salaryAdvanceKeys.all, "list"] as const,
};

/** Owned salary advance list. */
export function useMySalaryAdvances() {
	return useQuery({
		queryKey: salaryAdvanceKeys.list(),
		queryFn: ({ signal }) => getMySalaryAdvances(signal),
		select: (data) => data.items,
	});
}

/** Create a salary advance draft. */
export function useCreateSalaryAdvance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: SalaryAdvanceInput) => createSalaryAdvance(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: salaryAdvanceKeys.all });
		},
	});
}

/** Submit / cancel a salary advance. */
export function useSalaryAdvanceAction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, action }: { id: string; action: "submit" | "cancel" }) => updateSalaryAdvanceStatus(id, action),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: salaryAdvanceKeys.all });
		},
	});
}
