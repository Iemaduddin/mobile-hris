import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { ErrorView } from "@/core/widgets";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { EmptyView } from "@/core/widgets/states";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { StatusChip } from "@/core/widgets/status-chip";
import { formatMonthYear, formatTime, getAttendanceStatusLabel, shortWeekdayName, parseLocalDate, getAttendanceStatusTone } from "@/core/util/format";
import { useMonthlyHistory } from "../providers/attendance-queries";
import type { DailyRecap } from "../models/attendance";

/**
 * Monthly attendance history (mobile PRD Bag. 5.3.C).
 * Route `/attendance/history`, tap a day → detail.
 */
export default function HistoryScreen() {
	const [period, setPeriod] = useState(() => {
		const now = new Date();
		return { year: now.getFullYear(), month: now.getMonth() + 1 };
	});

	const { data, isLoading, isError, refetch, isFetching } = useMonthlyHistory(
		period.year,
		period.month,
	);

	const shift = useCallback((delta: number) => {
		setPeriod((prev) => {
			const next = new Date(prev.year, prev.month - 1 + delta, 1);
			return { year: next.getFullYear(), month: next.getMonth() + 1 };
		});
	}, []);

	const openDetail = useCallback((item: DailyRecap) => {
		const date = parseLocalDate(item.date);
		const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
			date.getDate(),
		).padStart(2, "0")}`;
		router.push({ pathname: "/attendance/history/[date]", params: { date: value } });
	}, []);

	return (
		<View style={styles.screen}>
			<ScreenHeader title="Riwayat Presensi" subtitle={formatMonthYear(period.month, period.year)} />
			<View style={styles.header}>
				<Pressable
					onPress={() => shift(-1)}
					style={styles.navButton}
					accessibilityRole="button"
					accessibilityLabel="Bulan sebelumnya"
				>
					<Text style={styles.navLabel}>‹</Text>
				</Pressable>
				<Text style={styles.period}>{formatMonthYear(period.month, period.year)}</Text>
				<Pressable
					onPress={() => shift(1)}
					style={styles.navButton}
					accessibilityRole="button"
					accessibilityLabel="Bulan berikutnya"
				>
					<Text style={styles.navLabel}>›</Text>
				</Pressable>
			</View>

			{isLoading ? (
				<ScreenSkeleton count={6} showTitle={false} />
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
							onPress={() => openDetail(item)}
							style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
							accessibilityRole="button"
						>
							<View style={styles.itemDate}>
								<Text style={styles.itemDay}>
									{parseLocalDate(item.date).getDate()}
								</Text>
								<Text style={styles.itemWeekday}>{shortWeekdayName(item.date)}</Text>
							</View>

							<View style={styles.itemBody}>
								<StatusChip label={getAttendanceStatusLabel(item.status)} tone={getAttendanceStatusTone(item.status)} />
								<Text style={styles.itemMeta}>
									Masuk {formatTime(item.actualCheckIn)} · Pulang {formatTime(item.actualCheckOut)}
								</Text>
							</View>

							<View style={styles.itemRight}>
								{item.lateMinutes > 0 ? (
									<Text style={[styles.badge, styles.badgeWarning]}>+{item.lateMinutes} m</Text>
								) : null}
								{item.earlyLeaveMinutes > 0 ? (
									<Text style={[styles.badge, styles.badgeInfo]}>-{item.earlyLeaveMinutes} m</Text>
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
	screen: { flex: 1, backgroundColor: colors.background },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	navButton: {
		width: TOUCH_MIN,
		height: TOUCH_MIN,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
		borderWidth: 1,
		borderColor: colors.border,
	},
	navLabel: { fontSize: fontSize.xl, color: colors.primary, fontWeight: "700", lineHeight: 28 },
	period: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
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
	itemDate: { alignItems: "center", minWidth: 36 },
	itemDay: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
	itemWeekday: { fontSize: fontSize.xs, color: colors.textMuted },
	itemBody: { flex: 1, gap: spacing.xs, alignItems: "flex-start" },
	itemMeta: { fontSize: fontSize.xs, color: colors.textMuted },
	itemRight: { alignItems: "flex-end", gap: spacing.xs },
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
