import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	buatUpdateData,
	getKeluargaSaya,
	getUpdateDataSaya,
	ubahStatusUpdateData,
	type InputUpdateData,
} from "../data/updatedata-api";

export const updatedataKeys = {
	all: ["updatedata"] as const,
	daftar: () => [...updatedataKeys.all, "daftar"] as const,
	keluarga: () => [...updatedataKeys.all, "keluarga"] as const,
};

/** Daftar usulan milik sendiri. */
export function useUpdateDataSaya() {
	return useQuery({
		queryKey: updatedataKeys.daftar(),
		queryFn: ({ signal }) => getUpdateDataSaya(signal),
		select: (data) => data.items,
	});
}

/** Anggota keluarga (pilihan target ubah). */
export function useKeluargaSaya() {
	return useQuery({
		queryKey: updatedataKeys.keluarga(),
		queryFn: ({ signal }) => getKeluargaSaya(signal),
		select: (data) => data.items,
	});
}

/** Buat draf usulan. */
export function useBuatUpdateData() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: InputUpdateData) => buatUpdateData(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: updatedataKeys.all });
		},
	});
}

/** Ajukan / batalkan usulan. */
export function useAksiUpdateData() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, aksi }: { id: string; aksi: "ajukan" | "batal" }) => ubahStatusUpdateData(id, aksi),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: updatedataKeys.all });
		},
	});
}
