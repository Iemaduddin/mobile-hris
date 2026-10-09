import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import {
	labelStatusPengajuan,
	toneStatusPengajuan,
	type JenisPengajuan,
	type TonePengajuan,
} from "../models/request";

export type KartuPengajuan = {
	id: string;
	jenis: JenisPengajuan;
	status: string;
	nomor?: string;
	judul: string;
	rentang: string;
	keterangan?: string;
};

const BADGE: Record<TonePengajuan, { box: ViewStyle; text: TextStyle }> = {
	info: { box: { backgroundColor: colors.primaryLight, borderColor: colors.primary }, text: { color: colors.primaryDark } },
	success: { box: { backgroundColor: colors.successLight, borderColor: colors.success }, text: { color: colors.success } },
	warning: { box: { backgroundColor: colors.warningLight, borderColor: colors.warning }, text: { color: colors.warning } },
	danger: { box: { backgroundColor: colors.dangerLight, borderColor: colors.danger }, text: { color: colors.danger } },
};

/** Satu baris daftar pengajuan (cuti/lembur/dinas) — PRD mobile Bag. 5.4. */
export function RequestCard({
	data,
	onPress,
}: {
	data: KartuPengajuan;
	onPress?: () => void;
}) {
	const tone = toneStatusPengajuan(data.status);
	const badge = BADGE[tone];

	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			accessibilityRole={onPress ? "button" : undefined}
			accessibilityLabel={`Pengajuan ${data.judul}, status ${labelStatusPengajuan(data.status)}`}
			style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
		>
			<View style={styles.head}>
				<Text style={styles.judul} numberOfLines={1}>
					{data.judul}
				</Text>
				<View style={[styles.badge, badge.box]}>
					<Text style={[styles.badgeText, badge.text]}>
						{labelStatusPengajuan(data.status)}
					</Text>
				</View>
			</View>

			{data.nomor ? (
				<Text style={styles.nomor} numberOfLines={1}>
					{data.nomor}
				</Text>
			) : null}

			<Text style={styles.rentang}>{data.rentang}</Text>

			{data.keterangan ? (
				<Text style={styles.keterangan} numberOfLines={2}>
					{data.keterangan}
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
	judul: { flex: 1, fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	badge: {
		minHeight: 24,
		justifyContent: "center",
		paddingHorizontal: spacing.sm,
		borderRadius: radius.full,
		borderWidth: 1,
	},
	badgeText: { fontSize: fontSize.xs, fontWeight: "700" },
	nomor: { fontSize: fontSize.xs, color: colors.textMuted },
	rentang: { fontSize: fontSize.sm, color: colors.text },
	keterangan: { fontSize: fontSize.xs, color: colors.textMuted },
});
