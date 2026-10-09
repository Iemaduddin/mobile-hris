import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	buatCuti,
	buatDinas,
	buatLembur,
	getCutiList,
	getDinasList,
	getJenisList,
	getLemburList,
	getSaldoCuti,
	getTimeline,
	ubahStatusCuti,
	ubahStatusDinas,
	ubahStatusLembur,
	unggahLampiran,
	type BerkasPilihan,
	type InputCuti,
	type InputDinas,
	type InputLembur,
} from "../data/requests-api";
import type {
	AksiPengajuan,
	HasilAksiPengajuan,
	JenisPengajuan,
} from "../models/request";

export const requestKeys = {
	all: ["pengajuan"] as const,
	jenis: () => [...requestKeys.all, "jenis"] as const,
	saldo: (tahun: number) => [...requestKeys.all, "saldo", tahun] as const,
	cuti: (status?: string) => [...requestKeys.all, "cuti", status ?? "semua"] as const,
	lembur: (status?: string) => [...requestKeys.all, "lembur", status ?? "semua"] as const,
	dinas: (status?: string) => [...requestKeys.all, "dinas", status ?? "semua"] as const,
	timeline: (jenis: JenisPengajuan, id: string) =>
		[...requestKeys.all, "timeline", jenis, id] as const,
};

/** Kode referensi approval backend (CUTI/LEMBUR/DINAS) untuk satu jenis pengajuan. */
export function kodeReferensi(jenis: JenisPengajuan): string {
	if (jenis === "cuti") return "CUTI";
	if (jenis === "lembur") return "LEMBUR";
	return "DINAS";
}

export function useJenisList() {
	return useQuery({
		queryKey: requestKeys.jenis(),
		queryFn: ({ signal }) => getJenisList(signal),
		select: (data) => data.items.filter((x) => x.isActive),
	});
}

export function useSaldoCuti(tahun: number) {
	return useQuery({
		queryKey: requestKeys.saldo(tahun),
		queryFn: ({ signal }) => getSaldoCuti(tahun, signal),
	});
}

export function useCutiList(status?: string) {
	return useQuery({
		queryKey: requestKeys.cuti(status),
		queryFn: ({ signal }) => getCutiList(status, signal),
		select: (data) => data.items,
	});
}

export function useLemburList(status?: string) {
	return useQuery({
		queryKey: requestKeys.lembur(status),
		queryFn: ({ signal }) => getLemburList(status, signal),
		select: (data) => data.items,
	});
}

export function useDinasList(status?: string) {
	return useQuery({
		queryKey: requestKeys.dinas(status),
		queryFn: ({ signal }) => getDinasList(status, signal),
		select: (data) => data.items,
	});
}

/** Riwayat approval untuk satu pengajuan (timeline di layar detail). */
export function useTimeline(jenis: JenisPengajuan, id: string) {
	return useQuery({
		queryKey: requestKeys.timeline(jenis, id),
		queryFn: ({ signal }) => getTimeline(kodeReferensi(jenis), id, signal),
		enabled: id.length > 0,
	});
}

/** Unggah lampiran pengajuan (PRD mobile Bag. 5.4 — file pendukung). */
export function useUnggahLampiran() {
	return useMutation({
		mutationFn: ({ file, ownerId }: { file: BerkasPilihan; ownerId: string }) =>
			unggahLampiran(file, ownerId),
	});
}

type InputPengajuan =
	| { jenis: "cuti"; input: InputCuti }
	| { jenis: "lembur"; input: InputLembur }
	| { jenis: "dinas"; input: InputDinas };

/** Simpan pengajuan baru (status DRAFT lalu diajukan di layar yang sama). */
export function useBuatPengajuan() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ jenis, input }: InputPengajuan): Promise<HasilAksiPengajuan> => {
			if (jenis === "cuti") return buatCuti(input as InputCuti);
			if (jenis === "lembur") return buatLembur(input as InputLembur);
			return buatDinas(input as InputDinas);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: requestKeys.all });
		},
	});
}

/** Ajukan / batalkan pengajuan (PUT /api/v1/{leave,overtime,duty}). */
export function useAksiPengajuan() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			jenis,
			id,
			aksi,
		}: {
			jenis: JenisPengajuan;
			id: string;
			aksi: AksiPengajuan;
		}): Promise<{ message: string }> => {
			if (jenis === "cuti") return ubahStatusCuti(id, aksi);
			if (jenis === "lembur") return ubahStatusLembur(id, aksi);
			return ubahStatusDinas(id, aksi);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: requestKeys.all });
		},
	});
}
