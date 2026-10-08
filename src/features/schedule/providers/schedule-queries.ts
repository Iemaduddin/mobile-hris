import { useQuery } from "@tanstack/react-query";
import { getJadwal } from "../data/schedule-api";

export const jadwalKeys = {
	all: ["jadwal"] as const,
	list: (mulai?: string, selesai?: string) => [...jadwalKeys.all, mulai ?? "default", selesai ?? "default"] as const,
};

/** Roster shift + penugasan kalender (default: 7 hari ke depan). */
export function useJadwal(mulai?: string, selesai?: string) {
	return useQuery({
		queryKey: jadwalKeys.list(mulai, selesai),
		queryFn: ({ signal }) => getJadwal(mulai, selesai, signal),
	});
}
