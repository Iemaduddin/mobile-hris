import { api } from "@/core/network/api-client";
import type {
	AksiPengajuan,
	HasilAksiPengajuan,
	JenisKetidakhadiran,
	PengajuanCuti,
	PengajuanDinas,
	PengajuanLembur,
	SaldoCuti,
} from "../models/request";

/**
 * Endpoint pengajuan mobile — PRD mobile Bag. 6 no.10-14.
 * `karyawanId` diambil dari sesi di sisi server, jadi tidak pernah dikirim dari sini.
 */

function qs(status?: string): string {
	return status ? `?status=${encodeURIComponent(status)}` : "";
}

export function getJenisList(signal?: AbortSignal): Promise<{ items: JenisKetidakhadiran[] }> {
	return api.get<{ items: JenisKetidakhadiran[] }>("/api/v1/leave/types", { signal });
}

export function getSaldoCuti(
	tahun: number,
	signal?: AbortSignal,
): Promise<{ tahun: number; saldo: SaldoCuti[] }> {
	return api.get<{ tahun: number; saldo: SaldoCuti[] }>(`/api/v1/leave/balance?tahun=${tahun}`, {
		signal,
	});
}

export function getCutiList(
	status?: string,
	signal?: AbortSignal,
): Promise<{ items: PengajuanCuti[] }> {
	return api.get<{ items: PengajuanCuti[] }>(`/api/v1/leave${qs(status)}`, { signal });
}

export function getLemburList(
	status?: string,
	signal?: AbortSignal,
): Promise<{ items: PengajuanLembur[] }> {
	return api.get<{ items: PengajuanLembur[] }>(`/api/v1/overtime${qs(status)}`, { signal });
}

export function getDinasList(
	status?: string,
	signal?: AbortSignal,
): Promise<{ items: PengajuanDinas[] }> {
	return api.get<{ items: PengajuanDinas[] }>(`/api/v1/duty${qs(status)}`, { signal });
}

export type InputCuti = {
	jenisId: number;
	mulai: string;
	selesai: string;
	alasan?: string;
	alamat?: string;
	telpDarurat?: string;
	lampiran?: string;
};

export type InputLembur = {
	tanggal: string;
	jamMulai: string;
	jamSelesai: string;
	alasan: string;
};

export type InputDinas = {
	jenis: string;
	mulai: string;
	selesai: string;
	lokasi?: string;
	keperluan?: string;
	lampiran?: string;
};

export function buatCuti(input: InputCuti): Promise<HasilAksiPengajuan> {
	return api.post<HasilAksiPengajuan>("/api/v1/leave", input);
}

export function buatLembur(input: InputLembur): Promise<HasilAksiPengajuan> {
	return api.post<HasilAksiPengajuan>("/api/v1/overtime", input);
}

export function buatDinas(input: InputDinas): Promise<HasilAksiPengajuan> {
	return api.post<HasilAksiPengajuan>("/api/v1/duty", input);
}

export function ubahStatusCuti(id: string, aksi: AksiPengajuan): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/leave", { id, aksi });
}

export function ubahStatusLembur(id: string, aksi: AksiPengajuan): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/overtime", { id, aksi });
}

export function ubahStatusDinas(id: string, aksi: AksiPengajuan): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/duty", { id, aksi });
}

export type BerkasPilihan = { uri: string; name: string; type: string };

export type HasilUnggah = { path: string; url: string; fileName: string };

/** `type` memakai kode referensi approval backend: CUTI | LEMBUR | DINAS. */
export type TahapApproval = {
	tahap: number;
	approverNama: string | null;
	approverRole: string | null;
	status: string;
	catatan: string | null;
	diprosesPada: string | null;
};

export type TimelinePengajuan = {
	type: string;
	id: string;
	status: string;
	items: TahapApproval[];
};

export function getTimeline(
	type: string,
	id: string,
	signal?: AbortSignal,
): Promise<TimelinePengajuan> {
	const query = `?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
	return api.get<TimelinePengajuan>(`/api/v1/approval/timeline${query}`, { signal });
}

/**
 * Unggah lampiran pengajuan — `ownerType` "pengajuan" (PRD Bag. 6, `/api/files`).
 * Tipe file & ukuran maksimal divalidasi server (jpeg/png/webp/gif/pdf, 10 MB).
 */
export function unggahLampiran(file: BerkasPilihan, ownerId: string): Promise<HasilUnggah> {
	const form = new FormData();
	form.append("ownerType", "pengajuan");
	form.append("ownerId", ownerId);
	form.append("subfolder", "lampiran");
	// React Native memakai {uri,name,type} sebagai bagian file FormData.
	form.append("file", file as unknown as Blob);
	return api.form<HasilUnggah>("/api/files", form);
}
