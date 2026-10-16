import type { ChipTone } from "@/core/widgets/status-chip";

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Draf",
	DIAJUKAN: "Diajukan",
	MENUNGGU_APPROVAL: "Menunggu approval",
	DISETUJUI: "Disetujui",
	LPJ_DIAJUKAN: "LPJ diverifikasi",
	SELESAI: "Selesai",
	DITOLAK: "Ditolak",
	DIBATALKAN: "Dibatalkan",
};

const STATUS_TONES: Record<string, ChipTone> = {
	DRAFT: "muted",
	DIAJUKAN: "warning",
	MENUNGGU_APPROVAL: "warning",
	DISETUJUI: "info",
	LPJ_DIAJUKAN: "warning",
	SELESAI: "success",
	DITOLAK: "danger",
	DIBATALKAN: "muted",
};

export function getUangDinasStatusLabel(status: string): string {
	return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function getUangDinasStatusTone(status: string): ChipTone {
	return STATUS_TONES[status] ?? "muted";
}
