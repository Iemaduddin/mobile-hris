import { api } from "@/core/network/api-client";

/** Notifikasi in-app mobile — P4-3 (endpoint sudah ada, layar baru). */

export type NotifikasiMobile = {
	id: string;
	judul: string;
	isi: string;
	jenis: string;
	referensiType: string | null;
	referensiId: string | null;
	url: string | null;
	dibaca: boolean;
	waktu: string;
};

export type PreferensiMobile = { pushAktif: boolean; emailAktif: boolean };

export type ResponsNotifikasi = {
	belumDibaca: number;
	preferensi: PreferensiMobile;
	items: NotifikasiMobile[];
};

export function getNotifikasi(hanyaBaru = false, signal?: AbortSignal): Promise<ResponsNotifikasi> {
	const qs = hanyaBaru ? "?belumDibaca=1" : "";
	return api.get<ResponsNotifikasi>(`/api/v1/notifications${qs}`, { signal });
}

export function tandaiDibaca(id: string): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/notifications", { id });
}

export function simpanPreferensi(input: PreferensiMobile): Promise<{ message: string }> {
	return api.post<{ message: string }>("/api/v1/notifications", input);
}

/** Petakan deep-link web server ke rute mobile. */
export function ruteMobile(item: Pick<NotifikasiMobile, "url" | "referensiType" | "referensiId">): string | null {
	if (item.url === "/approval") return "/approval";
	if (item.referensiType === "CUTI" && item.referensiId)
		return `/requests/detail?id=${encodeURIComponent(item.referensiId)}&jenis=cuti`;
	if (item.referensiType === "LEMBUR" && item.referensiId)
		return `/requests/detail?id=${encodeURIComponent(item.referensiId)}&jenis=lembur`;
	if (item.referensiType === "DINAS" && item.referensiId)
		return `/requests/detail?id=${encodeURIComponent(item.referensiId)}&jenis=dinas`;
	return null;
}
