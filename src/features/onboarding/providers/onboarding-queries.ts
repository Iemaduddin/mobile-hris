import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyOnboarding, getOnboardingDetail, toggleChecklistItem } from "../data/onboarding-api";

export const onboardingKeys = {
	all: ["onboarding"] as const,
	list: () => [...onboardingKeys.all, "list"] as const,
	detail: (id: string) => [...onboardingKeys.all, "detail", id] as const,
};

/** Owned onboarding records. */
export function useMyOnboarding() {
	return useQuery({
		queryKey: onboardingKeys.list(),
		queryFn: ({ signal }) => getMyOnboarding(signal),
		select: (data) => data.items,
	});
}

/** One onboarding's checklist detail. */
export function useOnboardingDetail(id: string) {
	return useQuery({
		queryKey: onboardingKeys.detail(id),
		queryFn: ({ signal }) => getOnboardingDetail(id, signal),
		select: (data) => data.onboarding,
		enabled: Boolean(id),
	});
}

/** Tick off / untick a checklist item. */
export function useToggleChecklistItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ itemId, action }: { itemId: string; action: "done" | "undo" }) =>
			toggleChecklistItem(itemId, action),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
		},
	});
}
