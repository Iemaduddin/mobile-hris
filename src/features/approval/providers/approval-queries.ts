import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInboxApproval, putusanApproval } from "../data/approval-api";

export const approvalKeys = {
	all: ["approval"] as const,
	inbox: () => [...approvalKeys.all, "inbox"] as const,
};

/** Antrean persetujuan untuk user login (atasan/HR) — P4-4. */
export function useInboxApproval() {
	return useQuery({
		queryKey: approvalKeys.inbox(),
		queryFn: ({ signal }) => getInboxApproval(signal),
		select: (data) => data.items,
	});
}

/** Setuju/tolak + catatan dari HP. */
export function usePutusanApproval() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			type,
			id,
			keputusan,
			catatan,
		}: {
			type: string;
			id: string;
			keputusan: "SETUJU" | "TOLAK";
			catatan?: string;
		}) => putusanApproval(type, id, keputusan, catatan),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: approvalKeys.inbox() });
		},
	});
}
