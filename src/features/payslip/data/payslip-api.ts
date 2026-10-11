import { api } from "@/core/network/api-client";
import type { SlipDetail, SlipSaya } from "../models/payslip";

/**
 * Endpoint slip gaji mobile — PRD mobile Bag. 5.5 / Bag. 6 no.15.
 * Server selalu menyaring ke `karyawanId` milik sesi login.
 */

export function getSlipSaya(signal?: AbortSignal): Promise<{ items: SlipSaya[] }> {
	return api.get<{ items: SlipSaya[] }>("/api/v1/payslip", { signal });
}

export function getSlipDetail(nomor: string, signal?: AbortSignal): Promise<{ slip: SlipDetail }> {
	return api.get<{ slip: SlipDetail }>(`/api/v1/payslip?nomor=${encodeURIComponent(nomor)}`, {
		signal,
	});
}
