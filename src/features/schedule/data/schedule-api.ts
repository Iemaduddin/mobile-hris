import { api } from "@/core/network/api-client";
import type { JadwalSaya } from "../models/schedule";

/**
 * Roster shift + penugasan kalender milik sendiri.
 * Default backend: 7 hari ke depan bila rentang tidak dikirim.
 */
export function getJadwal(mulai?: string, selesai?: string, signal?: AbortSignal): Promise<JadwalSaya> {
	const params = new URLSearchParams();
	if (mulai) params.set("mulai", mulai);
	if (selesai) params.set("selesai", selesai);
	const query = params.size > 0 ? `?${params.toString()}` : "";
	return api.get<JadwalSaya>(`/api/v1/schedule${query}`, { signal });
}
