import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";

type Props = TextInputProps & {
	label: string;
	error?: string;
};

/** Input berlabel + pesan validasi, mengikuti satu pola form (PRD Bag. 9). */
export function AppTextField({ label, error, style, ...rest }: Props) {
	return (
		<View style={styles.wrap}>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				placeholderTextColor={colors.textMuted}
				style={[styles.input, !!error && styles.inputError, style]}
				{...rest}
			/>
			{error ? <Text style={styles.error}>{error}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { marginBottom: spacing.lg },
	label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs },
	input: {
		minHeight: TOUCH_MIN,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		fontSize: fontSize.md,
		color: colors.text,
		backgroundColor: colors.surface,
	},
	inputError: { borderColor: colors.danger },
	error: { fontSize: fontSize.xs, color: colors.danger, marginTop: spacing.xs },
});
