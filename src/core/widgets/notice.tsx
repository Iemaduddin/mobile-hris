import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";

type Tone = "info" | "success" | "warning" | "danger";

export type NoticeProps = {
	tone?: Tone;
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
};

/**
 * Banner inline untuk hasil aksi & peringatan lokasi (PRD mobile Bag. 5.3.A:
 * status "di luar radius" dan "GPS simulasi" harus ditampilkan apa adanya).
 */
export function Notice({ tone = "info", title, description, actionLabel, onAction }: NoticeProps) {
	return (
		<View style={[styles.base, styles[tone]]} accessibilityRole="alert">
			<View style={styles.body}>
				<Text style={[styles.title, styles[`${tone}Text`]]}>{title}</Text>
				{description ? <Text style={styles.description}>{description}</Text> : null}
			</View>
			{actionLabel && onAction ? (
				<Pressable onPress={onAction} style={styles.action} accessibilityRole="button">
					<Text style={styles.actionLabel}>{actionLabel}</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	base: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		padding: spacing.md,
	},
	body: { flex: 1, gap: spacing.xs },
	title: { fontSize: fontSize.sm, fontWeight: "700" },
	description: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 },
	action: {
		minHeight: TOUCH_MIN - 16,
		justifyContent: "center",
		paddingHorizontal: spacing.sm,
	},
	actionLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.primary },

	info: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
	infoText: { color: colors.primaryDark },
	success: { backgroundColor: colors.successLight, borderColor: colors.success },
	successText: { color: colors.success },
	warning: { backgroundColor: colors.warningLight, borderColor: colors.warning },
	warningText: { color: colors.warning },
	danger: { backgroundColor: colors.dangerLight, borderColor: colors.danger },
	dangerText: { color: colors.danger },
});
