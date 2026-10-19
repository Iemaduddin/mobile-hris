import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createReimbursement,
	getMyReimbursements,
	updateReimbursementStatus,
	type ReimbursementInput,
} from "../data/reimbursements-api";

export const reimbursementKeys = {
	all: ["reimbursements"] as const,
	list: () => [...reimbursementKeys.all, "list"] as const,
};

/** Owned claim list. */
export function useMyReimbursements() {
	return useQuery({
		queryKey: reimbursementKeys.list(),
		queryFn: ({ signal }) => getMyReimbursements(signal),
		select: (data) => data.items,
	});
}

/** Create a claim draft (photo already uploaded by the screen). */
export function useCreateReimbursement() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: ReimbursementInput) => createReimbursement(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: reimbursementKeys.all });
		},
	});
}

/** Submit / cancel a claim. */
export function useReimbursementAction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, action }: { id: string; action: "submit" | "cancel" }) => updateReimbursementStatus(id, action),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: reimbursementKeys.all });
		},
	});
}
