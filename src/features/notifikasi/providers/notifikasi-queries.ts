import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getNotifications,
	markAsRead,
	savePreferences,
	type MobilePreferences,
} from "../data/notifikasi-api";

export const notificationKeys = {
	all: ["notifications"] as const,
	list: () => [...notificationKeys.all, "list"] as const,
};

/** List + unread badge + preferences. */
export function useNotifications() {
	return useQuery({
		queryKey: notificationKeys.list(),
		queryFn: ({ signal }) => getNotifications(false, signal),
	});
}

/** Mark one/all as read. */
export function useMarkAsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => markAsRead(id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
		},
	});
}

/** Save push/email channel preferences. */
export function useSavePreferences() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: MobilePreferences) => savePreferences(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
		},
	});
}
