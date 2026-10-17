import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { StatusChip, type ChipTone } from "@/core/widgets";
import {
	getRequestStatusLabel,
	getRequestStatusTone,
	type RequestKind,
} from "../models/request";

export type RequestCardData = {
	id: string;
	kind: RequestKind;
	status: string;
	number?: string;
	title: string;
	range: string;
	note?: string;
};

/** One request list row (leave/overtime/duty) — mobile PRD Bag. 5.4. */
export function RequestCard({
	data,
	onPress,
}: {
	data: RequestCardData;
	onPress?: () => void;
}) {
	const tone: ChipTone = getRequestStatusTone(data.status);

	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			accessibilityRole={onPress ? "button" : undefined}
			accessibilityLabel={`Pengajuan ${data.title}, status ${getRequestStatusLabel(data.status)}`}
			style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
		>
			<View style={styles.head}>
				<Text style={styles.title} numberOfLines={1}>
					{data.title}
				</Text>
				<StatusChip label={getRequestStatusLabel(data.status)} tone={tone} />
			</View>

			{data.number ? (
				<Text style={styles.number} numberOfLines={1}>
					{data.number}
				</Text>
			) : null}

			<Text style={styles.range}>{data.range}</Text>

			{data.note ? (
				<Text style={styles.note} numberOfLines={2}>
					{data.note}
				</Text>
			) : null}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	pressed: { backgroundColor: colors.backgroundAlt },
	head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	title: { flex: 1, fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	number: { fontSize: fontSize.xs, color: colors.textMuted },
	range: { fontSize: fontSize.sm, color: colors.text },
	note: { fontSize: fontSize.xs, color: colors.textMuted },
});
