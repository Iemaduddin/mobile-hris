import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buatKoreksi, getKoreksiSaya, ubahStatusKoreksi, type InputKoreksi } from "../data/koreksi-api";

export const koreksiKeys = {
	all: ["koreksi"] as const,
	daftar: () => [...koreksiKeys.all, "daftar"] as const,
};

/** Daftar koreksi milik sendiri. */
export function useKoreksiSaya() {
	return useQuery({
		queryKey: koreksiKeys.daftar(),
		queryFn: ({ signal }) => getKoreksiSaya(signal),
		select: (data) => data.items,
	});
}

/** Buat draf koreksi. */
export function useBuatKoreksi() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: InputKoreksi) => buatKoreksi(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: koreksiKeys.all });
		},
	});
}

/** Ajukan / batalkan koreksi. */
export function useAksiKoreksi() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, aksi }: { id: string; aksi: "ajukan" | "batal" }) => ubahStatusKoreksi(id, aksi),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: koreksiKeys.all });
		},
	});
}
