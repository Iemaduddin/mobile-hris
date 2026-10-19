import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAnnouncements, publishAnnouncement } from "../data/announcements-api";

export const announcementKeys = {
	all: ["announcements"] as const,
	list: () => [...announcementKeys.all, "list"] as const,
};

/** Live announcements + this week's events. */
export function useAnnouncements() {
	return useQuery({
		queryKey: announcementKeys.list(),
		queryFn: ({ signal }) => getAnnouncements(signal),
	});
}

/** Terbitkan pengumuman teks (HR/admin) lalu segarkan daftar. */
export function usePublishAnnouncement() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: publishAnnouncement,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: announcementKeys.all }),
	});
}
