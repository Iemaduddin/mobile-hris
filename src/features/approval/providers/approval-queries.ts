import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { decideApproval, getApprovalInbox } from "../data/approval-api";

export const approvalKeys = {
	all: ["approval"] as const,
	inbox: () => [...approvalKeys.all, "inbox"] as const,
};

/** Approval queue for the logged-in user (lead/HR) — P4-4. */
export function useApprovalInbox() {
	return useQuery({
		queryKey: approvalKeys.inbox(),
		queryFn: ({ signal }) => getApprovalInbox(signal),
		select: (data) => data.items,
	});
}

/** Approve/reject + note from the phone. */
export function useApprovalDecision() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			type,
			id,
			decision,
			note,
		}: {
			type: string;
			id: string;
			decision: "SETUJU" | "TOLAK";
			note?: string;
		}) => decideApproval(type, id, decision, note),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: approvalKeys.inbox() });
		},
	});
}
