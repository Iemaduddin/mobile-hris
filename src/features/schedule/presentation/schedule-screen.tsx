import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { ErrorView, ScreenHeader } from "@/core/widgets";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import {
	formatLongDate,
	shortWeekdayName,
	parseLocalDate,
	addDays,
	toDateOnly,
} from "@/core/util/format";
import { useSchedule } from "../providers/schedule-queries";
import type { RosterShift } from "../models/schedule";

const DAY_COUNT = 7;

/**
 * My schedule (mobile PRD Bag. 5.3.D) — read-only.
 * Shift roster + calendar assignments, with overnight-shift markers.
 */
export default function ScheduleScreen() {
	const [start, setStart] = useState(() => toDateOnly(new Date()));
	const end = useMemo(() => addDays(start, DAY_COUNT - 1), [start]);

	const { data, isLoading, isError, refetch, isFetching } = useSchedule(start, end);

	const rosterByDay = useMemo(() => {
		const map = new Map<string, RosterShift>();
		for (const item of data?.roster ?? []) map.set(item.date.slice(0, 10), item);
		return map;
	}, [data]);

	const dateList = useMemo(
		() => Array.from({ length: DAY_COUNT }, (_, index) => addDays(start, index)),
		[start],
	);

	const shift = useCallback((delta: number) => {
		setStart((prev) => addDays(prev, delta * DAY_COUNT));
	}, []);

	const today = toDateOnly(new Date());

	return (
		<>
			<ScreenHeader title="Jadwal Saya" />

			<View style={styles.nav}>
				<Pressable
					onPress={() => shift(-1)}
					style={styles.navButton}
					accessibilityRole="button"
					accessibilityLabel="Rentang sebelumnya"
				>
					<Text style={styles.navLabel}>‹</Text>
				</Pressable>
				<View style={styles.navTitle}>
					<Text style={styles.navRange}>
						{formatLongDate(start)} – {formatLongDate(end)}
					</Text>
					{isFetching ? <Text style={styles.navLoading}>Memuat…</Text> : null}
				</View>
				<Pressable
					onPress={() => shift(1)}
					style={styles.navButton}
					accessibilityRole="button"
					accessibilityLabel="Rentang berikutnya"
				>
					<Text style={styles.navLabel}>›</Text>
				</Pressable>
			</View>

			{isLoading ? (
				<ScreenSkeleton count={5} showTitle={false} />
			) : isError || !data ? (
				<ErrorView message="Gagal memuat jadwal." onRetry={() => void refetch()} />
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
					<Text style={styles.section}>Roster Shift</Text>
					{dateList.map((date) => {
						const roster = rosterByDay.get(date);
						const isToday = date === today;

						return (
							<View
								key={date}
								style={[styles.day, isToday && styles.today, !roster && styles.dayEmpty]}
							>
								<View style={styles.dayLeft}>
									<Text style={styles.dayName}>{shortWeekdayName(date)}</Text>
									<Text style={styles.dayDate}>{parseLocalDate(date).getDate()}</Text>
								</View>

								{roster ? (
									<View style={styles.dayBody}>
										<Text style={styles.shiftName}>{roster.name}</Text>
										<Text style={styles.shiftTime}>
											{roster.checkInTime ?? "-"} – {roster.checkOutTime ?? "-"}
										</Text>
										{roster.overnight ? (
											<Text style={styles.overnight}>
												Shift lintas hari — dimulai dari tanggal sebelumnya.
											</Text>
										) : null}
									</View>
								) : (
									<View style={styles.dayBody}>
										<Text style={styles.none}>Tidak ada roster</Text>
									</View>
								)}

								{isToday ? <Text style={styles.todayBadge}>Hari ini</Text> : null}
							</View>
						);
					})}

					<Text style={[styles.section, { marginTop: spacing.lg }]}>Penugasan Kalender</Text>
					{data.assignments.length === 0 ? (
						<Text style={styles.empty}>Tidak ada penugasan kalender.</Text>
					) : (
						data.assignments.map((item) => (
							<View key={`${item.calendar}-${item.start}`} style={styles.assignment}>
								<Text style={styles.shiftName}>{item.calendar}</Text>
								<Text style={styles.shiftTime}>
									{formatLongDate(item.start)}
									{item.end ? ` – ${formatLongDate(item.end)}` : " – berjalan"}
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

	day: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		padding: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	today: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
	dayEmpty: { opacity: 0.65 },
	dayLeft: { alignItems: "center", minWidth: 40 },
	dayName: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "700" },
	dayDate: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
	dayBody: { flex: 1, gap: 2 },
	todayBadge: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		color: colors.primaryDark,
		backgroundColor: colors.surface,
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: radius.full,
		overflow: "hidden",
	},

	shiftName: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	shiftTime: { fontSize: fontSize.xs, color: colors.textMuted },
	overnight: { fontSize: fontSize.xs, color: colors.warning, fontWeight: "600", marginTop: 2 },
	none: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: "italic" },
	empty: { fontSize: fontSize.sm, color: colors.textMuted },
	assignment: {
		padding: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		gap: 2,
	},
});
