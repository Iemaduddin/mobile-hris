import { api } from "@/core/network/api-client";
import type { MyPayslip, PayslipDetail } from "../models/payslips";

/**
 * Mobile payslips endpoints — mobile PRD Bag. 5.5 / Bag. 6 no.15.
 * The server always scopes to the logged-in session's `karyawanId`.
 */

export function getMyPayslips(signal?: AbortSignal): Promise<{ items: MyPayslip[] }> {
	return api.get<{ items: MyPayslip[] }>("/api/v1/payslips", { signal });
}

export function getPayslipDetail(number: string, signal?: AbortSignal): Promise<{ slip: PayslipDetail }> {
	return api.get<{ slip: PayslipDetail }>(`/api/v1/payslips?number=${encodeURIComponent(number)}`, {
		signal,
	});
}
