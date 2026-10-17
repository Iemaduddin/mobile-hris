import { useQuery } from "@tanstack/react-query";
import { getSchedule } from "../data/schedule-api";

export const scheduleKeys = {
	all: ["schedules"] as const,
	list: (start?: string, end?: string) => [...scheduleKeys.all, start ?? "default", end ?? "default"] as const,
};

/** Shift roster + calendar assignments (default: next 7 days). */
export function useSchedule(start?: string, end?: string) {
	return useQuery({
		queryKey: scheduleKeys.list(start, end),
		queryFn: ({ signal }) => getSchedule(start, end, signal),
	});
}
