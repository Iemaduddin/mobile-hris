import { useMutation, useQuery } from "@tanstack/react-query";
import { changePassword, getMyProfile } from "../data/profile-api";

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

/** P6-5 — ubah kata sandi; galat validasi server ditampilkan apa adanya. */
export function useChangePassword() {
	return useMutation({
		mutationFn: changePassword,
	});
}
