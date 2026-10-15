import type { ChipTone } from "@/core/widgets/status-chip";

const LABEL_STATUS: Record<string, string> = {
	DRAFT: "Draf",
	DIAJUKAN: "Diajukan",
	DISETUJUI: "Disetujui",
	DITOLAK: "Ditolak",
	DIBATALKAN: "Dibatalkan",
	LUNAS: "Lunas",
};

const TONE_STATUS: Record<string, ChipTone> = {
	DRAFT: "muted",
	DIAJUKAN: "warning",
	DISETUJUI: "info",
	DITOLAK: "danger",
	DIBATALKAN: "muted",
	LUNAS: "success",
};

export function labelStatusKasbon(status: string): string {
	return LABEL_STATUS[status] ?? status.replace(/_/g, " ");
}

export function toneStatusKasbon(status: string): ChipTone {
	return TONE_STATUS[status] ?? "muted";
}
