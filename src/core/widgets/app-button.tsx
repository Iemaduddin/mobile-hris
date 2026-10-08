import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";

type Props = {
	label: string;
	onPress: () => void;
	loading?: boolean;
	disabled?: boolean;
	variant?: "primary" | "outline" | "danger";
	style?: ViewStyle;
};

/** Tombol utama dengan tinggi sentuh minimum 44px (PRD Bag. 8 — ramah mobile). */
export function AppButton({
	label,
	onPress,
	loading = false,
	disabled = false,
	variant = "primary",
	style,
}: Props) {
	const isDisabled = disabled || loading;

	return (
		<Pressable
			onPress={onPress}
			disabled={isDisabled}
			accessibilityRole="button"
			style={({ pressed }) => [
				styles.base,
				styles[variant],
				pressed && styles.pressed,
				isDisabled && styles.disabled,
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator color={variant === "outline" ? colors.primary : colors.textInverse} />
			) : (
				<Text style={[styles.label, variant === "outline" && styles.labelOutline]}>{label}</Text>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		minHeight: TOUCH_MIN,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderRadius: radius.md,
		alignItems: "center",
		justifyContent: "center",
	},
	primary: { backgroundColor: colors.primary },
	outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary },
	danger: { backgroundColor: colors.danger },
	pressed: { opacity: 0.85 },
	disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
	label: { color: colors.textInverse, fontSize: fontSize.md, fontWeight: "600" },
	labelOutline: { color: colors.primary },
});
