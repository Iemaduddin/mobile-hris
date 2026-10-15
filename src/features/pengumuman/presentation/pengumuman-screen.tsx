import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { formatTanggal } from "@/core/util/format";
import { usePengumuman } from "../providers/pengumuman-queries";

/** Pengumuman perusahaan + peristiwa minggu ini (ultah/anniversary). */
export function PengumumanScreen() {
	const { data, isPending, isError, isFetching, refetch } = usePengumuman();

	if (isPending)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Pengumuman" subtitle="Memuat…" />
				<SkeletonLayar jumlah={3} judul={false} />
			</View>
		);
	if (isError || !data)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Pengumuman" />
				<ErrorView message="Gagal memuat pengumuman." onRetry={() => void refetch()} />
			</View>
		);

	const peristiwa = data.peristiwa;

	return (
		<View style={styles.layar}>
			<ScreenHeader
				title="Pengumuman"
				subtitle={data.items.length > 0 ? `${data.items.length} info` : undefined}
			/>
			<FlatList
				data={data.items}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={isFetching}
						onRefresh={() => void refetch()}
						tintColor={colors.primary}
					/>
				}
				ListHeaderComponent={
					peristiwa.length > 0 ? (
						<View style={styles.minggu}>
							<Text style={styles.mingguJudul}>Minggu ini 🎉</Text>
							{peristiwa.slice(0, 5).map((p) => (
								<Text key={`${p.jenis}-${p.nomorKaryawan}`} style={styles.mingguBaris}>
									{p.jenis === "ULTAH" ? "🎂" : "🏅"} {p.namaLengkap} — {p.info}
								</Text>
							))}
						</View>
					) : null
				}
				ListEmptyComponent={<EmptyView message="Belum ada pengumuman untuk Anda." />}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.judul}>{item.judul}</Text>
							{item.unitNama ? <Text style={styles.unit}>{item.unitNama}</Text> : null}
						</View>
						<Text style={styles.isi}>{item.isi}</Text>
						<Text style={styles.waktu}>{formatTanggal(item.tayangMulai)}</Text>
					</View>
				)}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	layar: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	minggu: {
		backgroundColor: colors.warningLight,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.warning,
		padding: spacing.md,
		gap: spacing.xs,
		marginBottom: spacing.sm,
	},
	mingguJudul: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	mingguBaris: { fontSize: fontSize.xs, color: colors.text },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	judul: { flex: 1, fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	unit: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: "700" },
	isi: { fontSize: fontSize.sm, color: colors.text },
	waktu: { fontSize: fontSize.xs, color: colors.textMuted },
	gap: { height: spacing.sm },
});
