import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView, LoadingView } from "@/core/widgets/states";
import { formatRupiah, kelompokRincian, labelPeriode } from "../models/payslip";
import { useSlipDetail } from "../providers/payslip-queries";

type Baris = { label: string; nilai: string; tebal?: boolean };

/**
 * Rincian satu slip gaji (PRD mobile Bag. 5.5): pendapatan, potongan,
 * dan iuran (perusahaan vs karyawan) sesuai `rincian` dari backend.
 */
export function PayslipDetailScreen({ nomor }: { nomor: string }) {
	const slip = useSlipDetail(nomor);

	if (slip.isPending) return <LoadingView label="Memuat rincian slip..." />;
	if (slip.isError || !slip.data)
		return (
			<View style={styles.wrap}>
				<ScreenHeader title="Slip Gaji" />
				<ErrorView
					message="Slip tidak ditemukan atau tidak dapat dimuat."
					onRetry={() => void slip.refetch()}
				/>
			</View>
		);

	const data = slip.data;
	const kelompok = kelompokRincian(data.rincian);

	const ringkasan: Baris[] = [
		{ label: "Gaji pokok", nilai: formatRupiah(data.gajiPokok) },
		{ label: "Total pendapatan", nilai: formatRupiah(data.totalPendapatan) },
		{ label: "Total potongan", nilai: formatRupiah(data.totalPotongan) },
		{ label: "Hari hadir", nilai: `${data.hariHadir} hari` },
		{ label: "Hari alpa", nilai: `${data.hariAlpa} hari` },
	];

	return (
		<View style={styles.wrap}>
			<ScreenHeader title={labelPeriode(data.periode)} subtitle={data.nomor} />
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.hero}>
					<Text style={styles.heroLabel}>Gaji bersih</Text>
					<Text style={styles.heroNilai}>{formatRupiah(data.gajiBersih)}</Text>
					<Text style={styles.heroMeta}>
						{data.karyawanNama} · {data.nomorKaryawan}
					</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Ringkasan</Text>
					{ringkasan.map((r, index) => (
						<View key={r.label} style={[styles.baris, index > 0 && styles.barisBorder]}>
							<Text style={styles.barisLabel}>{r.label}</Text>
							<Text style={[styles.barisNilai, r.tebal && styles.barisTebal]}>{r.nilai}</Text>
						</View>
					))}
				</View>

				{kelompok.map((g) => (
					<View key={g.kelompok} style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.cardTitle}>{g.label}</Text>
							<Text style={styles.cardSubtotal}>{formatRupiah(g.subtotal)}</Text>
						</View>
						{g.items.map((item, index) => (
							<View key={item.kode} style={[styles.baris, index > 0 && styles.barisBorder]}>
								<View style={styles.itemKiri}>
									<Text style={styles.barisLabel}>{item.nama}</Text>
									{item.keterangan ? <Text style={styles.keterangan}>{item.keterangan}</Text> : null}
								</View>
								<Text style={styles.barisNilai}>{formatRupiah(item.jumlah)}</Text>
							</View>
						))}
					</View>
				))}

				<Text style={styles.catatan}>Slip ini hanya terlihat oleh Anda.</Text>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },

	hero: {
		backgroundColor: colors.primaryLight,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.primary,
		padding: spacing.lg,
		alignItems: "center",
		gap: spacing.xs,
	},
	heroLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.primaryDark },
	heroNilai: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.primaryDark },
	heroMeta: { fontSize: fontSize.xs, color: colors.textMuted },

	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
	},
	cardHead: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.sm,
		marginBottom: spacing.xs,
	},
	cardTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	cardSubtotal: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	baris: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		paddingVertical: spacing.sm,
		minHeight: 36,
	},
	barisBorder: { borderTopWidth: 1, borderTopColor: colors.border },
	itemKiri: { flex: 1, gap: 2 },
	barisLabel: { flex: 1, fontSize: fontSize.sm, color: colors.text },
	barisNilai: { fontSize: fontSize.sm, color: colors.text, fontVariant: ["tabular-nums"] },
	barisTebal: { fontWeight: "700" },
	keterangan: { fontSize: fontSize.xs, color: colors.textMuted },
	catatan: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: "center" },
});
