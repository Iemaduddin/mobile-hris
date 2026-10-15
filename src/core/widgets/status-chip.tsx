import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";

export type ChipTone = "info" | "success" | "warning" | "danger" | "muted";

const GAYA: Record<ChipTone, { box: ViewStyle; text: TextStyle }> = {
	info: {
		box: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
		text: { color: colors.primaryDark },
	},
	success: {
		box: { backgroundColor: colors.successLight, borderColor: colors.success },
		text: { color: colors.success },
	},
	warning: {
		box: { backgroundColor: colors.warningLight, borderColor: colors.warning },
		text: { color: colors.warning },
	},
	danger: {
		box: { backgroundColor: colors.dangerLight, borderColor: colors.danger },
		text: { color: colors.danger },
	},
	muted: {
		box: { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
		text: { color: colors.textMuted },
	},
};

/** Chip status baku — satu-satunya cara menampilkan status di semua layar (UX-1). */
export function StatusChip({ label, tone = "muted" }: { label: string; tone?: ChipTone }) {
	const gaya = GAYA[tone];
	return (
		<View style={[styles.box, gaya.box]}>
			<Text style={[styles.text, gaya.text]} numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	box: {
		alignSelf: "flex-start",
		minHeight: 24,
		justifyContent: "center",
		paddingHorizontal: spacing.sm,
		borderRadius: radius.full,
		borderWidth: 1,
	},
	text: { fontSize: fontSize.xs, fontWeight: "700" },
});
