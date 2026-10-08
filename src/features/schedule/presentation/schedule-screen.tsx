import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { ErrorView, LoadingView, ScreenHeader } from "@/core/widgets";
import {
	formatTanggalPanjang,
	namaHariPendek,
	parseTanggal,
	tambahHari,
	toTanggalOnly,
} from "@/core/util/format";
import { useJadwal } from "../providers/schedule-queries";
import type { RosterShift } from "../models/schedule";

const JUMLAH_HARI = 7;

/**
 * Jadwal saya (PRD mobile Bag. 5.3.D) — read-only.
 * Roster shift + penugasan kalender, dengan penanda khusus shift lintas hari.
 */
export default function JadwalScreen() {
	const [awal, setAwal] = useState(() => toTanggalOnly(new Date()));
	const akhir = useMemo(() => tambahHari(awal, JUMLAH_HARI - 1), [awal]);

	const { data, isLoading, isError, refetch, isFetching } = useJadwal(awal, akhir);

	const rosterPerHari = useMemo(() => {
		const map = new Map<string, RosterShift>();
		for (const item of data?.roster ?? []) map.set(item.tanggal.slice(0, 10), item);
		return map;
	}, [data]);

	const daftarTanggal = useMemo(
		() => Array.from({ length: JUMLAH_HARI }, (_, index) => tambahHari(awal, index)),
		[awal],
	);

	const geser = useCallback((delta: number) => {
		setAwal((prev) => tambahHari(prev, delta * JUMLAH_HARI));
	}, []);

	const hariIni = toTanggalOnly(new Date());

	return (
		<>
			<ScreenHeader title="Jadwal Saya" />

			<View style={styles.nav}>
				<Pressable
					onPress={() => geser(-1)}
					style={styles.navBtn}
					accessibilityRole="button"
					accessibilityLabel="Rentang sebelumnya"
				>
					<Text style={styles.navLabel}>‹</Text>
				</Pressable>
				<View style={styles.navTitle}>
					<Text style={styles.navRange}>
						{formatTanggalPanjang(awal)} – {formatTanggalPanjang(akhir)}
					</Text>
					{isFetching ? <Text style={styles.navLoading}>Memuat…</Text> : null}
				</View>
				<Pressable
					onPress={() => geser(1)}
					style={styles.navBtn}
					accessibilityRole="button"
					accessibilityLabel="Rentang berikutnya"
				>
					<Text style={styles.navLabel}>›</Text>
				</Pressable>
			</View>

			{isLoading ? (
				<LoadingView />
			) : isError || !data ? (
				<ErrorView message="Gagal memuat jadwal." onRetry={() => void refetch()} />
			) : (
				<ScrollView contentContainerStyle={styles.content}>
					<Text style={styles.section}>Roster Shift</Text>
					{daftarTanggal.map((tanggal) => {
						const roster = rosterPerHari.get(tanggal);
						const isHariIni = tanggal === hariIni;

						return (
							<View
								key={tanggal}
								style={[styles.hari, isHariIni && styles.hariIni, !roster && styles.hariKosong]}
							>
								<View style={styles.hariKiri}>
									<Text style={styles.hariNama}>{namaHariPendek(tanggal)}</Text>
									<Text style={styles.hariTanggal}>{parseTanggal(tanggal).getDate()}</Text>
								</View>

								{roster ? (
									<View style={styles.hariBody}>
										<Text style={styles.shiftNama}>{roster.nama}</Text>
										<Text style={styles.shiftJam}>
											{roster.jamMasuk ?? "-"} – {roster.jamKeluar ?? "-"}
										</Text>
										{roster.lintasHari ? (
											<Text style={styles.lintasHari}>
												Shift lintas hari — dimulai dari tanggal sebelumnya.
											</Text>
										) : null}
									</View>
								) : (
									<View style={styles.hariBody}>
										<Text style={styles.tidakAda}>Tidak ada roster</Text>
									</View>
								)}

								{isHariIni ? <Text style={styles.hariIniBadge}>Hari ini</Text> : null}
							</View>
						);
					})}

					<Text style={[styles.section, { marginTop: spacing.lg }]}>Penugasan Kalender</Text>
					{data.penugasan.length === 0 ? (
						<Text style={styles.kosong}>Tidak ada penugasan kalender.</Text>
					) : (
						data.penugasan.map((item) => (
							<View key={`${item.kalender}-${item.mulai}`} style={styles.penugasan}>
								<Text style={styles.shiftNama}>{item.kalender}</Text>
								<Text style={styles.shiftJam}>
									{formatTanggalPanjang(item.mulai)}
									{item.selesai ? ` – ${formatTanggalPanjang(item.selesai)}` : " – berjalan"}
								</Text>
							</View>
						))
					)}
				</ScrollView>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	nav: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.md,
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
	navTitle: { flex: 1, alignItems: "center", gap: 2 },
	navRange: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text, textAlign: "center" },
	navLoading: { fontSize: fontSize.xs, color: colors.textMuted },

	content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
	section: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		color: colors.textMuted,
		textTransform: "uppercase",
		marginBottom: spacing.xs,
	},

	hari: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		padding: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	hariIni: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
	hariKosong: { opacity: 0.65 },
	hariKiri: { alignItems: "center", minWidth: 40 },
	hariNama: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "700" },
	hariTanggal: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
	hariBody: { flex: 1, gap: 2 },
	hariIniBadge: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		color: colors.primaryDark,
		backgroundColor: colors.surface,
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: radius.full,
		overflow: "hidden",
	},

	shiftNama: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	shiftJam: { fontSize: fontSize.xs, color: colors.textMuted },
	lintasHari: { fontSize: fontSize.xs, color: colors.warning, fontWeight: "600", marginTop: 2 },
	tidakAda: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: "italic" },
	kosong: { fontSize: fontSize.sm, color: colors.textMuted },
	penugasan: {
		padding: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		gap: 2,
	},
});
