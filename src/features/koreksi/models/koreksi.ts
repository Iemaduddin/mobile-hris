import type { ChipTone } from "@/core/widgets/status-chip";

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Draf",
	DIAJUKAN: "Diajukan",
	MENUNGGU_APPROVAL: "Menunggu approval",
	DISETUJUI: "Disetujui",
	DITOLAK: "Ditolak",
	DIBATALKAN: "Dibatalkan",
	SELESAI: "Selesai",
};

const STATUS_TONES: Record<string, ChipTone> = {
	DRAFT: "muted",
	DIAJUKAN: "warning",
	MENUNGGU_APPROVAL: "warning",
	DISETUJUI: "success",
	DITOLAK: "danger",
	DIBATALKAN: "muted",
	SELESAI: "success",
};

export function getCorrectionStatusLabel(status: string): string {
	return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function getCorrectionStatusTone(status: string): ChipTone {
	return STATUS_TONES[status] ?? "muted";
}
