import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";

type Props = {
	title: string;
	subtitle?: string;
	/** Sembunyikan tombol kembali (layar root tab). */
	hideBack?: boolean;
};

/** Header baku untuk layar stack — menyediakan tombol kembali 44px. */
export function ScreenHeader({ title, subtitle, hideBack = false }: Props) {
	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<View style={styles.bar}>
				{hideBack ? (
					<View style={styles.spacer} />
				) : (
					<Pressable
						onPress={() => router.back()}
						style={styles.back}
						accessibilityRole="button"
						accessibilityLabel="Kembali"
						hitSlop={8}
					>
						<Text style={styles.backLabel}>‹</Text>
					</Pressable>
				)}
				<View style={styles.titles}>
					<Text style={styles.title} numberOfLines={1}>
						{title}
					</Text>
					{subtitle ? (
						<Text style={styles.subtitle} numberOfLines={1}>
							{subtitle}
						</Text>
					) : null}
				</View>
				<View style={styles.spacer} />
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { backgroundColor: colors.background },
	bar: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	spacer: { width: TOUCH_MIN, height: TOUCH_MIN },
	back: {
		width: TOUCH_MIN,
		height: TOUCH_MIN,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
	},
	backLabel: { fontSize: fontSize.xxl, color: colors.primary, fontWeight: "700", lineHeight: 32 },
	titles: { flex: 1, alignItems: "center", gap: 2 },
	title: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	subtitle: { fontSize: fontSize.xs, color: colors.textMuted },
});
