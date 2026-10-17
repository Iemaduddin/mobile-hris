import { useQuery } from "@tanstack/react-query";
import { getAnnouncements } from "../data/pengumuman-api";

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
