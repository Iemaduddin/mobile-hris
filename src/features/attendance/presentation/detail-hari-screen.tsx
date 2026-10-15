import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ErrorView, ScreenHeader } from "@/core/widgets";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { formatJam, formatTanggalPanjang, labelStatusRekap, labelTipePresensi, toneStatusRekap } from "@/core/util/format";
import { useDetailHari } from "../providers/attendance-queries";

/**
 * Detail presensi satu hari (PRD mobile Bag. 5.3.C):
 * rekap status + daftar event lengkap dengan flag radius/GPS simulasi.
 */
export default function DetailHariScreen() {
	const { tanggal } = useLocalSearchParams<{ tanggal: string }>();
	const nilai = typeof tanggal === "string" ? tanggal : "";

	const { data, isLoading, isError, isFetching, refetch } = useDetailHari(nilai);

	return (
		<>
			<ScreenHeader title="Detail Presensi" subtitle={nilai || undefined} />

			{isLoading ? (
				<SkeletonLayar jumlah={2} judul={false} />
			) : isError || !data ? (
				<ErrorView message="Gagal memuat detail presensi." onRetry={() => void refetch()} />
			) : (
				<ScrollView
					contentContainerStyle={styles.content}
					refreshControl={
						<RefreshControl
							refreshing={isFetching}
							onRefresh={() => void refetch()}
							tintColor={colors.primary}
						/>
					}
				>
					<View style={styles.card}>
						<Text style={styles.tanggal}>{formatTanggalPanjang(data.tanggal)}</Text>
						<View style={styles.chipWrap}>
							<StatusChip label={labelStatusRekap(data.status)} tone={toneStatusRekap(data.status)} />
						</View>

						<View style={styles.grid}>
							<Stat label="Masuk" value={formatJam(data.masukAktual)} />
							<Stat label="Pulang" value={formatJam(data.keluarAktual)} />
							<Stat
								label="Telat"
								value={(data.telatMenit ?? 0) > 0 ? `${data.telatMenit} m` : "-"}
								warna={(data.telatMenit ?? 0) > 0 ? colors.warning : undefined}
							/>
							<Stat
								label="Pulang Cepat"
								value={(data.pulangCepatMenit ?? 0) > 0 ? `${data.pulangCepatMenit} m` : "-"}
							/>
							<Stat label="Lembur" value={(data.lemburMenit ?? 0) > 0 ? `${data.lemburMenit} m` : "-"} />
						</View>
					</View>

					<View style={styles.card}>
						<Text style={styles.cardLabel}>Event</Text>
						{data.events.length === 0 ? (
							<Text style={styles.kosong}>Tidak ada event presensi pada tanggal ini.</Text>
						) : (
							data.events.map((event) => (
								<View
									key={`${event.tipe}-${event.waktu}`}
									style={[styles.event, event.status === "DIBATALKAN" && styles.eventBatal]}
								>
									<View style={{ flex: 1 }}>
										<Text style={styles.eventTipe}>{labelTipePresensi(event.tipe)}</Text>
										<Text style={styles.eventMeta}>
											{formatJam(event.waktu)} · {event.sumber} · {event.status}
										</Text>
										{event.catatan ? (
											<Text style={styles.eventCatatan}>{event.catatan}</Text>
										) : null}
									</View>
									<View style={styles.flags}>
										{event.diLuarRadius === true ? (
											<Text style={[styles.flag, styles.flagDanger]}>Luar radius</Text>
										) : null}
										{event.isMocked ? (
											<Text style={[styles.flag, styles.flagWarning]}>GPS mock</Text>
										) : null}
									</View>
								</View>
							))
						)}
					</View>
				</ScrollView>
			)}
		</>
	);
}

function Stat({ label, value, warna }: { label: string; value: string; warna?: string }) {
	return (
		<View style={styles.stat}>
			<Text style={styles.statLabel}>{label}</Text>
			<Text style={[styles.statValue, warna ? { color: warna } : null]}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.lg,
		gap: spacing.sm,
	},
	cardLabel: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		color: colors.textMuted,
		textTransform: "uppercase",
	},
	tanggal: { fontSize: fontSize.sm, color: colors.textMuted },
	chipWrap: { alignItems: "flex-start" },
	grid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
	stat: { width: "33.33%", gap: 2, paddingVertical: spacing.sm },
	statLabel: { fontSize: fontSize.xs, color: colors.textMuted },
	statValue: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },

	kosong: { fontSize: fontSize.sm, color: colors.textMuted },
	event: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	eventBatal: { opacity: 0.5 },
	eventTipe: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
	eventMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
	eventCatatan: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: "italic", marginTop: 2 },
	flags: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap", justifyContent: "flex-end" },
	flag: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: radius.full,
		overflow: "hidden",
	},
	flagDanger: { backgroundColor: colors.dangerLight, color: colors.danger },
	flagWarning: { backgroundColor: colors.warningLight, color: colors.warning },
});
