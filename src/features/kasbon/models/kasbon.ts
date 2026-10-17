import type { ChipTone } from "@/core/widgets/status-chip";

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Draf",
	DIAJUKAN: "Diajukan",
	DISETUJUI: "Disetujui",
	DITOLAK: "Ditolak",
	DIBATALKAN: "Dibatalkan",
	LUNAS: "Lunas",
};

const STATUS_TONES: Record<string, ChipTone> = {
	DRAFT: "muted",
	DIAJUKAN: "warning",
	DISETUJUI: "info",
	DITOLAK: "danger",
	DIBATALKAN: "muted",
	LUNAS: "success",
};

export function getSalaryAdvanceStatusLabel(status: string): string {
	return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function getSalaryAdvanceStatusTone(status: string): ChipTone {
	return STATUS_TONES[status] ?? "muted";
}
