import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "@/core/theme";

/** State loading standar. */
export function LoadingView({ label = "Memuat..." }: { label?: string }) {
	return (
		<View style={styles.center}>
			<ActivityIndicator size="large" color={colors.primary} />
			<Text style={styles.text}>{label}</Text>
		</View>
	);
}

/** State gagal + aksi coba lagi. */
export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
	return (
		<View style={styles.center}>
			<Text style={styles.title}>Terjadi kesalahan</Text>
			<Text style={styles.text}>{message}</Text>
			{onRetry ? (
				<Pressable onPress={onRetry} style={styles.retry} accessibilityRole="button">
					<Text style={styles.retryLabel}>Coba lagi</Text>
				</Pressable>
			) : null}
		</View>
	);
}

/** State kosong. */
export function EmptyView({ message }: { message: string }) {
	return (
		<View style={styles.center}>
			<Text style={styles.text}>{message}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.xl,
		gap: spacing.sm,
	},
	title: { fontSize: fontSize.lg, fontWeight: "600", color: colors.text },
	text: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center" },
	retry: {
		marginTop: spacing.sm,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: colors.primary,
	},
	retryLabel: { color: colors.primary, fontWeight: "600" },
});
