import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import type { ReactNode } from "react";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";

type Props = TextInputProps & {
	label: string;
	error?: string;
	rightAccessory?: ReactNode;
};

/** Input berlabel + pesan validasi, mengikuti satu pola form (PRD Bag. 9). */
export function AppTextField({ label, error, style, rightAccessory, ...rest }: Props) {
	return (
		<View style={styles.wrap}>
			<Text style={styles.label}>{label}</Text>
			<View style={[styles.inputRow, !!error && styles.inputError]}>
				<TextInput placeholderTextColor={colors.textMuted} style={[styles.input, style]} {...rest} />
				{rightAccessory}
			</View>
			{error ? <Text style={styles.error}>{error}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { marginBottom: spacing.lg },
	label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs },
	inputRow: {
		minHeight: TOUCH_MIN,
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		backgroundColor: colors.surface,
	},
	input: {
		flex: 1,
		minHeight: TOUCH_MIN,
		paddingHorizontal: spacing.md,
		fontSize: fontSize.md,
		color: colors.text,
	},
	inputError: { borderColor: colors.danger },
	error: { fontSize: fontSize.xs, color: colors.danger, marginTop: spacing.xs },
});
