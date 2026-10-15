import type { ChipTone } from "@/core/widgets/status-chip";

const LABEL_STATUS: Record<string, string> = {
	DRAFT: "Draf",
	DIAJUKAN: "Diajukan",
	MENUNGGU_APPROVAL: "Menunggu approval",
	DISETUJUI: "Disetujui",
	DITOLAK: "Ditolak",
	DIBATALKAN: "Dibatalkan",
};

const TONE_STATUS: Record<string, ChipTone> = {
	DRAFT: "muted",
	DIAJUKAN: "warning",
	MENUNGGU_APPROVAL: "warning",
	DISETUJUI: "success",
	DITOLAK: "danger",
	DIBATALKAN: "muted",
};

export function labelStatusTukar(status: string): string {
	return LABEL_STATUS[status] ?? status.replace(/_/g, " ");
}

export function toneStatusTukar(status: string): ChipTone {
	return TONE_STATUS[status] ?? "muted";
}
