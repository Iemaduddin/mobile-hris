import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getNotifikasi,
	simpanPreferensi,
	tandaiDibaca,
	type PreferensiMobile,
} from "../data/notifikasi-api";

export const notifikasiKeys = {
	all: ["notifikasi"] as const,
	daftar: () => [...notifikasiKeys.all, "daftar"] as const,
};

/** Daftar + badge belum dibaca + preferensi. */
export function useNotifikasi() {
	return useQuery({
		queryKey: notifikasiKeys.daftar(),
		queryFn: ({ signal }) => getNotifikasi(false, signal),
	});
}

/** Tandai satu/semua dibaca. */
export function useTandaiDibaca() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => tandaiDibaca(id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: notifikasiKeys.all });
		},
	});
}

/** Simpan preferensi kanal push/email. */
export function useSimpanPreferensi() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: PreferensiMobile) => simpanPreferensi(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: notifikasiKeys.all });
		},
	});
}
