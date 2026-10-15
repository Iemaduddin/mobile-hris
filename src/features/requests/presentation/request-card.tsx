import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { StatusChip, type ChipTone } from "@/core/widgets";
import {
	labelStatusPengajuan,
	toneStatusPengajuan,
	type JenisPengajuan,
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

/** Satu baris daftar pengajuan (cuti/lembur/dinas) — PRD mobile Bag. 5.4. */
export function RequestCard({
	data,
	onPress,
}: {
	data: KartuPengajuan;
	onPress?: () => void;
}) {
	const tone: ChipTone = toneStatusPengajuan(data.status);

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
				<StatusChip label={labelStatusPengajuan(data.status)} tone={tone} />
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
	nomor: { fontSize: fontSize.xs, color: colors.textMuted },
	rentang: { fontSize: fontSize.sm, color: colors.text },
	keterangan: { fontSize: fontSize.xs, color: colors.textMuted },
});
