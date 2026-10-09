import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { formatTanggalPanjang } from "@/core/util/format";
import type { TahapApproval } from "../data/requests-api";

type State = "done" | "aktif" | "gagal" | "pending";
type Tahap = { label: string; state: State };

const URUTAN = ["DRAFT", "DIAJUKAN", "MENUNGGU_APPROVAL", "DISETUJUI"] as const;

const LABEL: Record<string, string> = {
	DRAFT: "Draf dibuat",
	DIAJUKAN: "Diajukan",
	MENUNGGU_APPROVAL: "Menunggu approval",
	DISETUJUI: "Disetujui",
	DITOLAK: "Ditolak",
	DIBATALKAN: "Dibatalkan",
	SELESAI: "Selesai",
};

const DOT: Record<State, string> = {
	done: colors.success,
	aktif: colors.primary,
	gagal: colors.danger,
	pending: colors.disabled,
};

const DOT_TEXT: Record<State, string> = {
	done: colors.textInverse,
	aktif: colors.textInverse,
	gagal: colors.textInverse,
	pending: colors.textMuted,
};

/**
 * Susunan tahap status pengajuan (PRD mobile Bag. 5.4):
 * DRAFT → DIAJUKAN → MENUNGGU_APPROVAL → DISETUJUI | DITOLAK, atau DIBATALKAN.
 */
export function stagesDariStatus(status: string, adaApproval: boolean): Tahap[] {
	const idx = (URUTAN as readonly string[]).indexOf(status);
	if (idx >= 0) {
		return URUTAN.map((k, i) => ({
			label: LABEL[k],
			state: i < idx ? "done" : i === idx ? "aktif" : "pending",
		}));
	}
	if (status === "SELESAI") {
		return [
			...URUTAN.map((k) => ({ label: LABEL[k], state: "done" as State })),
			{ label: LABEL.SELESAI, state: "aktif" },
		];
	}
	if (status === "DITOLAK") {
		return [
			...URUTAN.slice(0, 3).map((k) => ({ label: LABEL[k], state: "done" as State })),
			{ label: LABEL.DITOLAK, state: "gagal" },
		];
	}
	if (status === "DIBATALKAN") {
		const tahap: Tahap[] = [{ label: LABEL.DRAFT, state: "done" }];
		if (adaApproval) tahap.push({ label: LABEL.DIAJUKAN, state: "done" });
		tahap.push({ label: LABEL.DIBATALKAN, state: "gagal" });
		return tahap;
	}
	return [{ label: LABEL.DRAFT, state: "aktif" }];
}

/** Timeline status ringkas — selalu tampil di layar detail. */
export function StatusTimeline({ status, adaApproval }: { status: string; adaApproval: boolean }) {
	const tahap = stagesDariStatus(status, adaApproval);

	return (
		<View style={styles.panel}>
			<Text style={styles.title}>Riwayat status</Text>
			{tahap.map((t, i) => (
				<View key={`${t.label}-${i}`} style={styles.row}>
					<View style={styles.gutter}>
						<View style={[styles.dot, { backgroundColor: DOT[t.state] }]}>
							<Text style={[styles.dotText, { color: DOT_TEXT[t.state] }]}>
								{t.state === "done" ? "✓" : t.state === "gagal" ? "✕" : ""}
							</Text>
						</View>
						{i < tahap.length - 1 ? <View style={[styles.line, { backgroundColor: DOT[t.state] }]} /> : null}
					</View>
					<Text style={[styles.label, t.state === "pending" ? styles.labelPending : null]}>{t.label}</Text>
				</View>
			))}
		</View>
	);
}

function labelRole(role: string | null): string {
	if (role === "ADMIN_HR" || role === "SUPER_ADMIN") return "HR";
	return role || "—";
}

function labelStatusStep(status: string): string {
	if (status === "DISETUJUI") return "Disetujui";
	if (status === "DITOLAK") return "Ditolak";
	return "Menunggu";
}

function toneStatusStep(status: string): string {
	if (status === "DISETUJUI") return colors.success;
	if (status === "DITOLAK") return colors.danger;
	return colors.warning;
}

/** Rincian tiap tahap approval (siapa memutuskan & kapan). */
export function ApprovalSteps({ items }: { items: TahapApproval[] }) {
	if (items.length === 0) return null;

	return (
		<View style={styles.panel}>
			<Text style={styles.title}>Tahap approval</Text>
			{items.map((s) => (
				<View key={s.tahap} style={styles.step}>
					<View style={styles.stepHead}>
						<Text style={styles.stepWho} numberOfLines={1}>
							Tahap {s.tahap} · {s.approverNama ?? labelRole(s.approverRole)}
						</Text>
						<Text style={[styles.stepStatus, { color: toneStatusStep(s.status) }]}>
							{labelStatusStep(s.status)}
						</Text>
					</View>
					{s.diprosesPada ? (
						<Text style={styles.stepMeta}>{formatTanggalPanjang(s.diprosesPada)}</Text>
					) : (
						<Text style={styles.stepMeta}>Belum diproses</Text>
					)}
					{s.catatan ? <Text style={styles.stepCatatan}>“{s.catatan}”</Text> : null}
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	panel: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		backgroundColor: colors.surface,
		padding: spacing.md,
		gap: spacing.sm,
	},
	title: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textMuted },

	row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	gutter: { alignItems: "center", width: 20 },
	dot: {
		width: 20,
		height: 20,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	dotText: { fontSize: fontSize.xs, fontWeight: "700", lineHeight: 14 },
	line: { width: 2, height: 16, borderRadius: 1 },
	label: { flex: 1, fontSize: fontSize.sm, color: colors.text },
	labelPending: { color: colors.textMuted },

	step: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.sm,
		padding: spacing.sm,
		gap: 2,
		backgroundColor: colors.backgroundAlt,
	},
	stepHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	stepWho: { flex: 1, fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
	stepStatus: { fontSize: fontSize.xs, fontWeight: "700" },
	stepMeta: { fontSize: fontSize.xs, color: colors.textMuted },
	stepCatatan: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: "italic" },
});
