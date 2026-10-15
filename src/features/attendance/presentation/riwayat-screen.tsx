import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { ErrorView } from "@/core/widgets";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { EmptyView } from "@/core/widgets/states";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { StatusChip } from "@/core/widgets/status-chip";
import { formatBulanTahun, formatJam, labelStatusRekap, namaHariPendek, parseTanggal, toneStatusRekap } from "@/core/util/format";
import { useRiwayatBulanan } from "../providers/attendance-queries";
import type { RekapHarian } from "../models/attendance";

/**
 * Riwayat presensi bulanan (PRD mobile Bag. 5.3.C).
 * Rute `/attendance/riwayat`, tap hari → detail.
 */
export default function RiwayatScreen() {
	const [periode, setPeriode] = useState(() => {
		const now = new Date();
		return { tahun: now.getFullYear(), bulan: now.getMonth() + 1 };
	});

	const { data, isLoading, isError, refetch, isFetching } = useRiwayatBulanan(
		periode.tahun,
		periode.bulan,
	);

	const geser = useCallback((delta: number) => {
		setPeriode((prev) => {
			const next = new Date(prev.tahun, prev.bulan - 1 + delta, 1);
			return { tahun: next.getFullYear(), bulan: next.getMonth() + 1 };
		});
	}, []);

	const bukaDetail = useCallback((item: RekapHarian) => {
		const tanggal = parseTanggal(item.tanggal);
		const nilai = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, "0")}-${String(
			tanggal.getDate(),
		).padStart(2, "0")}`;
		router.push({ pathname: "/attendance/riwayat/[tanggal]", params: { tanggal: nilai } });
	}, []);

	return (
		<View style={styles.layar}>
			<ScreenHeader title="Riwayat Presensi" subtitle={formatBulanTahun(periode.bulan, periode.tahun)} />
			<View style={styles.header}>
				<Pressable
					onPress={() => geser(-1)}
					style={styles.navBtn}
					accessibilityRole="button"
					accessibilityLabel="Bulan sebelumnya"
				>
					<Text style={styles.navLabel}>‹</Text>
				</Pressable>
				<Text style={styles.periode}>{formatBulanTahun(periode.bulan, periode.tahun)}</Text>
				<Pressable
					onPress={() => geser(1)}
					style={styles.navBtn}
					accessibilityRole="button"
					accessibilityLabel="Bulan berikutnya"
				>
					<Text style={styles.navLabel}>›</Text>
				</Pressable>
			</View>

			{isLoading ? (
				<SkeletonLayar jumlah={6} judul={false} />
			) : isError || !data ? (
				<ErrorView message="Gagal memuat riwayat presensi." onRetry={() => void refetch()} />
			) : (
				<FlatList
					data={data.items}
					keyExtractor={(item) => String(item.id)}
					refreshing={isFetching}
					onRefresh={() => void refetch()}
					contentContainerStyle={styles.list}
					ListEmptyComponent={
						<EmptyView message="Belum ada rekap presensi untuk bulan ini." />
					}
					renderItem={({ item }) => (
						<Pressable
							onPress={() => bukaDetail(item)}
							style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
							accessibilityRole="button"
						>
							<View style={styles.itemTanggal}>
								<Text style={styles.itemHari}>
									{parseTanggal(item.tanggal).getDate()}
								</Text>
								<Text style={styles.itemBulan}>{namaHariPendek(item.tanggal)}</Text>
							</View>

							<View style={styles.itemBody}>
								<StatusChip label={labelStatusRekap(item.status)} tone={toneStatusRekap(item.status)} />
								<Text style={styles.itemMeta}>
									Masuk {formatJam(item.masukAktual)} · Pulang {formatJam(item.keluarAktual)}
								</Text>
							</View>

							<View style={styles.itemKanan}>
								{item.telatMenit > 0 ? (
									<Text style={[styles.badge, styles.badgeWarning]}>+{item.telatMenit} m</Text>
								) : null}
								{item.pulangCepatMenit > 0 ? (
									<Text style={[styles.badge, styles.badgeInfo]}>-{item.pulangCepatMenit} m</Text>
								) : null}
							</View>
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	layar: { flex: 1, backgroundColor: colors.background },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	navBtn: {
		width: TOUCH_MIN,
		height: TOUCH_MIN,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
		borderWidth: 1,
		borderColor: colors.border,
	},
	navLabel: { fontSize: fontSize.xl, color: colors.primary, fontWeight: "700", lineHeight: 28 },
	periode: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
	list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },

	item: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		padding: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	itemPressed: { backgroundColor: colors.backgroundAlt },
	itemTanggal: { alignItems: "center", minWidth: 36 },
	itemHari: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
	itemBulan: { fontSize: fontSize.xs, color: colors.textMuted },
	itemBody: { flex: 1, gap: spacing.xs, alignItems: "flex-start" },
	itemMeta: { fontSize: fontSize.xs, color: colors.textMuted },
	itemKanan: { alignItems: "flex-end", gap: spacing.xs },
	badge: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: radius.full,
		overflow: "hidden",
	},
	badgeWarning: { backgroundColor: colors.warningLight, color: colors.warning },
	badgeInfo: { backgroundColor: colors.primaryLight, color: colors.primaryDark },
});
