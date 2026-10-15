import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buatKasbon, getKasbonSaya, ubahStatusKasbon, type InputKasbon } from "../data/kasbon-api";

export const kasbonKeys = {
	all: ["kasbon"] as const,
	daftar: () => [...kasbonKeys.all, "daftar"] as const,
};

/** Daftar kasbon milik sendiri. */
export function useKasbonSaya() {
	return useQuery({
		queryKey: kasbonKeys.daftar(),
		queryFn: ({ signal }) => getKasbonSaya(signal),
		select: (data) => data.items,
	});
}

/** Buat draf kasbon. */
export function useBuatKasbon() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: InputKasbon) => buatKasbon(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: kasbonKeys.all });
		},
	});
}

/** Ajukan / batalkan kasbon. */
export function useAksiKasbon() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, aksi }: { id: string; aksi: "ajukan" | "batal" }) => ubahStatusKasbon(id, aksi),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: kasbonKeys.all });
		},
	});
}
