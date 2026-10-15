import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	buatTukar,
	getPasanganTukar,
	getTukarSaya,
	ubahStatusTukar,
	type InputTukar,
} from "../data/tukar-api";

export const tukarKeys = {
	all: ["tukar"] as const,
	daftar: () => [...tukarKeys.all, "daftar"] as const,
	pasangan: () => [...tukarKeys.all, "pasangan"] as const,
};

/** Usulan keluar + masuk untuk saya. */
export function useTukarSaya() {
	return useQuery({
		queryKey: tukarKeys.daftar(),
		queryFn: ({ signal }) => getTukarSaya(signal),
	});
}

/** Opsi pasangan (semua karyawan aktif kecuali diri sendiri). */
export function usePasanganTukar() {
	return useQuery({
		queryKey: tukarKeys.pasangan(),
		queryFn: ({ signal }) => getPasanganTukar(signal),
		select: (data) => data.items,
	});
}

/** Buat draf tukar. */
export function useBuatTukar() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: InputTukar) => buatTukar(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: tukarKeys.all });
		},
	});
}

/** Ajukan / batal / setuju / tolak. */
export function useAksiTukar() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			aksi,
			catatan,
		}: {
			id: string;
			aksi: "ajukan" | "batal" | "setuju" | "tolak";
			catatan?: string;
		}) => ubahStatusTukar(id, aksi, catatan),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: tukarKeys.all });
		},
	});
}
