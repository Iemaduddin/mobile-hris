import type { ChipTone } from "@/core/widgets/status-chip";

const STATUS_LABELS: Record<string, string> = {
	BERJALAN: "Berjalan",
	SELESAI: "Selesai",
	DIBATALKAN: "Dibatalkan",
};

const STATUS_TONES: Record<string, ChipTone> = {
	BERJALAN: "info",
	SELESAI: "success",
	DIBATALKAN: "muted",
};

const ITEM_LABELS: Record<string, string> = {
	BELUM: "Belum",
	SELESAI: "Selesai",
	TERVERIFIKASI: "Terverifikasi",
};

const ITEM_TONES: Record<string, ChipTone> = {
	BELUM: "muted",
	SELESAI: "warning",
	TERVERIFIKASI: "success",
};

export function getOnboardingStatusLabel(status: string): string {
	return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function getOnboardingStatusTone(status: string): ChipTone {
	return STATUS_TONES[status] ?? "muted";
}

export function getChecklistStatusLabel(status: string): string {
	return ITEM_LABELS[status] ?? status.replace(/_/g, " ");
}

export function getChecklistStatusTone(status: string): ChipTone {
	return ITEM_TONES[status] ?? "muted";
}
