import { useQuery } from "@tanstack/react-query";
import { getProfil } from "../data/profile-api";

export const profilKeys = {
	all: ["profil"] as const,
	utama: () => [...profilKeys.all, "utama"] as const,
};

/** Profil lengkap (read-only) — kontak, penempatan aktif, kontrak aktif. */
export function useProfil() {
	return useQuery({
		queryKey: profilKeys.utama(),
		queryFn: ({ signal }) => getProfil(signal),
		select: (data) => data.profil,
	});
}
