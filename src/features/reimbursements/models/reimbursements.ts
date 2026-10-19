import type { ChipTone } from "@/core/widgets/status-chip";

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Draf",
	DIAJUKAN: "Diajukan",
	MENUNGGU_APPROVAL: "Menunggu approval",
	DISETUJUI: "Disetujui",
	DITOLAK: "Ditolak",
	DIBAYAR: "Dibayar",
	DIBATALKAN: "Dibatalkan",
};

const STATUS_TONES: Record<string, ChipTone> = {
	DRAFT: "muted",
	DIAJUKAN: "warning",
	MENUNGGU_APPROVAL: "warning",
	DISETUJUI: "info",
	DITOLAK: "danger",
	DIBAYAR: "success",
	DIBATALKAN: "muted",
};

export function getReimbursementStatusLabel(status: string): string {
	return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function getReimbursementStatusTone(status: string): ChipTone {
	return STATUS_TONES[status] ?? "muted";
}
