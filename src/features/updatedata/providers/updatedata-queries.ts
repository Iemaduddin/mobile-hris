import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createDataUpdate,
	getMyDataUpdates,
	getMyFamily,
	updateDataUpdateStatus,
	type DataUpdateInput,
} from "../data/updatedata-api";

export const dataUpdateKeys = {
	all: ["data-updates"] as const,
	list: () => [...dataUpdateKeys.all, "list"] as const,
	family: () => [...dataUpdateKeys.all, "family"] as const,
};

/** Owned proposal list. */
export function useMyDataUpdates() {
	return useQuery({
		queryKey: dataUpdateKeys.list(),
		queryFn: ({ signal }) => getMyDataUpdates(signal),
		select: (data) => data.items,
	});
}

/** Family members (change-target options). */
export function useMyFamily() {
	return useQuery({
		queryKey: dataUpdateKeys.family(),
		queryFn: ({ signal }) => getMyFamily(signal),
		select: (data) => data.items,
	});
}

/** Create a proposal draft. */
export function useCreateDataUpdate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: DataUpdateInput) => createDataUpdate(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: dataUpdateKeys.all });
		},
	});
}

/** Submit / cancel a proposal. */
export function useDataUpdateAction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, action }: { id: string; action: "submit" | "cancel" }) => updateDataUpdateStatus(id, action),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: dataUpdateKeys.all });
		},
	});
}
