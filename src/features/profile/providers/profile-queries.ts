import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../data/profile-api";

export const profileKeys = {
	all: ["profile"] as const,
	main: () => [...profileKeys.all, "main"] as const,
};

/** Full profile (read-only) — contacts, active placement, active contract. */
export function useProfile() {
	return useQuery({
		queryKey: profileKeys.main(),
		queryFn: ({ signal }) => getMyProfile(signal),
		select: (data) => data.profile,
	});
}
