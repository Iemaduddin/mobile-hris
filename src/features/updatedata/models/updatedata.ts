import type { ChipTone } from "@/core/widgets/status-chip";

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Draf",
	DIAJUKAN: "Diajukan",
	MENUNGGU_APPROVAL: "Menunggu verifikasi HR",
	DISETUJUI: "Diterapkan",
	DITOLAK: "Ditolak",
	DIBATALKAN: "Dibatalkan",
};

const STATUS_TONES: Record<string, ChipTone> = {
	DRAFT: "muted",
	DIAJUKAN: "warning",
	MENUNGGU_APPROVAL: "warning",
	DISETUJUI: "success",
	DITOLAK: "danger",
	DIBATALKAN: "muted",
};

export function getDataUpdateStatusLabel(status: string): string {
	return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function getDataUpdateStatusTone(status: string): ChipTone {
	return STATUS_TONES[status] ?? "muted";
}
