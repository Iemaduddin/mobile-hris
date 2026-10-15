import { useQuery } from "@tanstack/react-query";
import { getPengumuman } from "../data/pengumuman-api";

export const pengumumanKeys = {
	all: ["pengumuman"] as const,
	daftar: () => [...pengumumanKeys.all, "daftar"] as const,
};

/** Pengumuman tayang + peristiwa minggu ini. */
export function usePengumuman() {
	return useQuery({
		queryKey: pengumumanKeys.daftar(),
		queryFn: ({ signal }) => getPengumuman(signal),
	});
}
