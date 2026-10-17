import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ErrorView, ScreenHeader } from "@/core/widgets";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { formatTime, formatLongDate, getAttendanceStatusLabel, getPresenceTypeLabel, getAttendanceStatusTone } from "@/core/util/format";
import { useDayDetail } from "../providers/attendance-queries";

/**
 * One-day attendance detail (mobile PRD Bag. 5.3.C):
 * status recap + full event list with radius/mock-GPS flags.
 */
export default function DayDetailScreen() {
	const { date } = useLocalSearchParams<{ date: string }>();
	const value = typeof date === "string" ? date : "";

	const { data, isLoading, isError, isFetching, refetch } = useDayDetail(value);

	return (
		<>
			<ScreenHeader title="Detail Presensi" subtitle={value || undefined} />

			{isLoading ? (
				<ScreenSkeleton count={2} showTitle={false} />
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
						<Text style={styles.date}>{formatLongDate(data.date)}</Text>
						<View style={styles.chipWrap}>
							<StatusChip label={getAttendanceStatusLabel(data.status)} tone={getAttendanceStatusTone(data.status)} />
						</View>

						<View style={styles.grid}>
							<Stat label="Masuk" value={formatTime(data.actualCheckIn)} />
							<Stat label="Pulang" value={formatTime(data.actualCheckOut)} />
							<Stat
								label="Telat"
								value={(data.lateMinutes ?? 0) > 0 ? `${data.lateMinutes} m` : "-"}
								color={(data.lateMinutes ?? 0) > 0 ? colors.warning : undefined}
							/>
							<Stat
								label="Pulang Cepat"
								value={(data.earlyLeaveMinutes ?? 0) > 0 ? `${data.earlyLeaveMinutes} m` : "-"}
							/>
							<Stat label="Lembur" value={(data.overtimeMinutes ?? 0) > 0 ? `${data.overtimeMinutes} m` : "-"} />
						</View>
					</View>

					<View style={styles.card}>
						<Text style={styles.cardLabel}>Event</Text>
						{data.events.length === 0 ? (
							<Text style={styles.empty}>Tidak ada event presensi pada tanggal ini.</Text>
						) : (
							data.events.map((event) => (
								<View
									key={`${event.eventType}-${event.time}`}
									style={[styles.event, event.status === "DIBATALKAN" && styles.eventCancelled]}
								>
									<View style={{ flex: 1 }}>
										<Text style={styles.eventType}>{getPresenceTypeLabel(event.eventType)}</Text>
										<Text style={styles.eventMeta}>
											{formatTime(event.time)} · {event.source} · {event.status}
										</Text>
										{event.note ? (
											<Text style={styles.eventNote}>{event.note}</Text>
										) : null}
									</View>
									<View style={styles.flags}>
										{event.isOutsideRadius === true ? (
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

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
	return (
		<View style={styles.stat}>
			<Text style={styles.statLabel}>{label}</Text>
			<Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
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
	date: { fontSize: fontSize.sm, color: colors.textMuted },
	chipWrap: { alignItems: "flex-start" },
	grid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
	stat: { width: "33.33%", gap: 2, paddingVertical: spacing.sm },
	statLabel: { fontSize: fontSize.xs, color: colors.textMuted },
	statValue: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },

	empty: { fontSize: fontSize.sm, color: colors.textMuted },
	event: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	eventCancelled: { opacity: 0.5 },
	eventType: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
	eventMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
	eventNote: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: "italic", marginTop: 2 },
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
