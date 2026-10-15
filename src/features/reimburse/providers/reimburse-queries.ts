import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	buatReimburse,
	getReimburseSaya,
	ubahStatusReimburse,
	type InputReimburse,
} from "../data/reimburse-api";

export const reimburseKeys = {
	all: ["reimburse"] as const,
	daftar: () => [...reimburseKeys.all, "daftar"] as const,
};

/** Daftar klaim milik sendiri. */
export function useReimburseSaya() {
	return useQuery({
		queryKey: reimburseKeys.daftar(),
		queryFn: ({ signal }) => getReimburseSaya(signal),
		select: (data) => data.items,
	});
}

/** Buat draf klaim (foto sudah diunggah dulu oleh layar). */
export function useBuatReimburse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: InputReimburse) => buatReimburse(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: reimburseKeys.all });
		},
	});
}

/** Ajukan / batalkan klaim. */
export function useAksiReimburse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, aksi }: { id: string; aksi: "ajukan" | "batal" }) => ubahStatusReimburse(id, aksi),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: reimburseKeys.all });
		},
	});
}
