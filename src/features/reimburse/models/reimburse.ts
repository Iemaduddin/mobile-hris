import type { ChipTone } from "@/core/widgets/status-chip";

const LABEL_STATUS: Record<string, string> = {
	DRAFT: "Draf",
	DIAJUKAN: "Diajukan",
	MENUNGGU_APPROVAL: "Menunggu approval",
	DISETUJUI: "Disetujui",
	DITOLAK: "Ditolak",
	DIBAYAR: "Dibayar",
	DIBATALKAN: "Dibatalkan",
};

const TONE_STATUS: Record<string, ChipTone> = {
	DRAFT: "muted",
	DIAJUKAN: "warning",
	MENUNGGU_APPROVAL: "warning",
	DISETUJUI: "info",
	DITOLAK: "danger",
	DIBAYAR: "success",
	DIBATALKAN: "muted",
};

export function labelStatusReimburse(status: string): string {
	return LABEL_STATUS[status] ?? status.replace(/_/g, " ");
}

export function toneStatusReimburse(status: string): ChipTone {
	return TONE_STATUS[status] ?? "muted";
}
