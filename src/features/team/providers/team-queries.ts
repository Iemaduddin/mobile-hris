import { useQuery } from "@tanstack/react-query";
import { getTeam } from "../data/team-api";

export const teamKeys = {
	all: ["team"] as const,
	today: () => [...teamKeys.all, "today"] as const,
};

export function useTeam() {
	return useQuery({
		queryKey: teamKeys.today(),
		queryFn: ({ signal }) => getTeam(signal),
	});
}
