import { api } from "@/core/network/api-client";

/**
 * Inbox approval manajer — P4-4 (read-only master/payroll: hanya
 * setuju/tolak + catatan; otorisasi per tahap ditegakkan server).
 */

export type InboxApproval = {
	type: string;
	id: string;
	nomor: string;
	karyawanId: string;
	karyawanNama: string;
	nomorKaryawan: string;
	ringkasan: string;
	tahap: number;
	diajukanPada: string | null;
};

export type HasilPutusan = { message: string };

const LABEL_TIPE: Record<string, string> = {
	CUTI: "Cuti/Izin",
	LEMBUR: "Lembur",
	DINAS: "Dinas/WFH",
	MUTASI: "Mutasi",
	RESIGN: "Resign",
	PROBATION: "Probation",
	TUKAR_SHIFT: "Tukar Shift",
	KOREKSI: "Koreksi Presensi",
	REIMBURSE: "Reimbursement",
	UANGDINAS: "Uang Dinas",
};

export function labelTipeApproval(type: string): string {
	return LABEL_TIPE[type] ?? type;
}

export function getInboxApproval(signal?: AbortSignal): Promise<{ count: number; items: InboxApproval[] }> {
	return api.get<{ count: number; items: InboxApproval[] }>("/api/v1/approval", { signal });
}

export function putusanApproval(
	type: string,
	id: string,
	keputusan: "SETUJU" | "TOLAK",
	catatan?: string,
): Promise<HasilPutusan> {
	return api.post<HasilPutusan>("/api/v1/approval", { type, id, keputusan, catatan });
}
