import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { StatusChip, type ChipTone } from "@/core/widgets/status-chip";
import { formatLongDate } from "@/core/util/format";
import type { ApprovalStage } from "../data/requests-api";

type State = "done" | "active" | "failed" | "pending";
type Stage = { label: string; state: State };

const ORDER = ["DRAFT", "DIAJUKAN", "MENUNGGU_APPROVAL", "DISETUJUI"] as const;

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
	active: colors.primary,
	failed: colors.danger,
	pending: colors.disabled,
};

const DOT_TEXT: Record<State, string> = {
	done: colors.textInverse,
	active: colors.textInverse,
	failed: colors.textInverse,
	pending: colors.textMuted,
};

/**
 * Request status stage list (mobile PRD Bag. 5.4):
 * DRAFT → DIAJUKAN → MENUNGGU_APPROVAL → DISETUJUI | DITOLAK, or DIBATALKAN.
 */
export function stagesFromStatus(status: string, hasApproval: boolean): Stage[] {
	const idx = (ORDER as readonly string[]).indexOf(status);
	if (idx >= 0) {
		return ORDER.map((k, i) => ({
			label: LABEL[k],
			state: i < idx ? "done" : i === idx ? "active" : "pending",
		}));
	}
	if (status === "SELESAI") {
		return [
			...ORDER.map((k) => ({ label: LABEL[k], state: "done" as State })),
			{ label: LABEL.SELESAI, state: "active" },
		];
	}
	if (status === "DITOLAK") {
		return [
			...ORDER.slice(0, 3).map((k) => ({ label: LABEL[k], state: "done" as State })),
			{ label: LABEL.DITOLAK, state: "failed" },
		];
	}
	if (status === "DIBATALKAN") {
		const stages: Stage[] = [{ label: LABEL.DRAFT, state: "done" }];
		if (hasApproval) stages.push({ label: LABEL.DIAJUKAN, state: "done" });
		stages.push({ label: LABEL.DIBATALKAN, state: "failed" });
		return stages;
	}
	return [{ label: LABEL.DRAFT, state: "active" }];
}

/** Compact status timeline — always shown on the detail screen. */
export function StatusTimeline({ status, hasApproval }: { status: string; hasApproval: boolean }) {
	const stages = stagesFromStatus(status, hasApproval);

	return (
		<View style={styles.panel}>
			<Text style={styles.title}>Riwayat status</Text>
			{stages.map((t, i) => (
				<View key={`${t.label}-${i}`} style={styles.row}>
					<View style={styles.gutter}>
						<View style={[styles.dot, { backgroundColor: DOT[t.state] }]}>
							<Text style={[styles.dotText, { color: DOT_TEXT[t.state] }]}>
								{t.state === "done" ? "✓" : t.state === "failed" ? "✕" : ""}
							</Text>
						</View>
						{i < stages.length - 1 ? <View style={[styles.line, { backgroundColor: DOT[t.state] }]} /> : null}
					</View>
					<Text style={[styles.label, t.state === "pending" ? styles.labelPending : null]}>{t.label}</Text>
				</View>
			))}
		</View>
	);
}

function getRoleLabel(role: string | null): string {
	if (role === "ADMIN_HR" || role === "SUPER_ADMIN") return "HR";
	return role || "—";
}

function getStepStatusLabel(status: string): string {
	if (status === "DISETUJUI") return "Disetujui";
	if (status === "DITOLAK") return "Ditolak";
	return "Menunggu";
}

function getStepStatusTone(status: string): ChipTone {
	if (status === "DISETUJUI") return "success";
	if (status === "DITOLAK") return "danger";
	return "warning";
}

/** Per-stage approval detail (who decided & when). */
export function ApprovalSteps({ items }: { items: ApprovalStage[] }) {
	if (items.length === 0) return null;

	return (
		<View style={styles.panel}>
			<Text style={styles.title}>Tahap approval</Text>
			{items.map((s) => (
				<View key={s.stage} style={styles.step}>
					<View style={styles.stepHead}>
						<Text style={styles.stepWho} numberOfLines={1}>
							Tahap {s.stage} · {s.approverName ?? getRoleLabel(s.approverRole)}
						</Text>
						<StatusChip label={getStepStatusLabel(s.status)} tone={getStepStatusTone(s.status)} />
					</View>
					{s.processedAt ? (
						<Text style={styles.stepMeta}>{formatLongDate(s.processedAt)}</Text>
					) : (
						<Text style={styles.stepMeta}>Belum diproses</Text>
					)}
					{s.note ? <Text style={styles.stepNote}>“{s.note}”</Text> : null}
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
	stepMeta: { fontSize: fontSize.xs, color: colors.textMuted },
	stepNote: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: "italic" },
});
