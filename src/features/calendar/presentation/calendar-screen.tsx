import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import {
	formatDate,
	formatLongDate,
	formatMonthYear,
	parseLocalDate,
	toDateOnly,
} from "@/core/util/format";
import { useSchedule } from "@/features/schedule/providers/schedule-queries";
import { useAnnouncements } from "@/features/announcements/providers/announcements-queries";
import { monthMatrix, monthRange } from "../models/calendar";

/**
 * Team calendar — M-ESS-8. Composes the existing `v1/schedule` roster (libur days)
 * and the announcements endpoint for this-week events (birthdays/anniversaries); no new endpoint.
 */

const WEEK_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function CalendarScreen() {
	const now = useMemo(() => new Date(), []);
	const todayIso = toDateOnly(now);
	const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
	const [selected, setSelected] = useState(todayIso);

	const range = monthRange(cursor.year, cursor.month);
	const schedule = useSchedule(range.start, range.end);
	const announcements = useAnnouncements();

	const roster = useMemo(() => schedule.data?.roster ?? [], [schedule.data]);
	const assignments = useMemo(() => schedule.data?.assignments ?? [], [schedule.data]);
	const liburDates = useMemo(() => schedule.data?.libur ?? [], [schedule.data]);
	const events = useMemo(() => announcements.data?.events ?? [], [announcements.data]);

	const rosterByDate = useMemo(() => new Map(roster.map((r) => [r.date, r])), [roster]);
	const liburSet = useMemo(() => new Set(liburDates), [liburDates]);
	const eventSet = useMemo(
		() => new Set(events.map((e) => e.date)),
		[events],
	);
	const selectedRoster = rosterByDate.get(selected);
	const selectedEvents = useMemo(() => events.filter((e) => e.date === selected), [events, selected]);

	function shiftMonth(delta: number) {
		const target = new Date(cursor.year, cursor.month + delta, 1);
		setCursor({ year: target.getFullYear(), month: target.getMonth() });
		setSelected(toDateOnly(target));
	}

	const loading = schedule.isPending || announcements.isPending;
	const failed =
		(schedule.isError && schedule.data === undefined) ||
		(announcements.isError && announcements.data === undefined);

	if (loading)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Kalender" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (failed)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Kalender" />
				<ErrorView
					message="Gagal memuat kalender."
					onRetry={() => {
						void schedule.refetch();
						void announcements.refetch();
					}}
				/>
			</View>
		);

	return (
		<View style={styles.screen}>
			<ScreenHeader title="Kalender" subtitle="Libur & ulang tahun tim" />
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={schedule.isRefetching || announcements.isRefetching}
						onRefresh={() => {
							void schedule.refetch();
							void announcements.refetch();
						}}
						tintColor={colors.primary}
					/>
				}
			>
				<View style={styles.monthNav}>
					<Pressable
						onPress={() => shiftMonth(-1)}
						accessibilityRole="button"
						accessibilityLabel="Bulan sebelumnya"
						style={styles.monthBtn}
					>
						<Text style={styles.monthBtnText}>‹</Text>
					</Pressable>
					<Text style={styles.monthLabel}>{formatMonthYear(cursor.month + 1, cursor.year)}</Text>
					<Pressable
						onPress={() => shiftMonth(1)}
						accessibilityRole="button"
						accessibilityLabel="Bulan berikutnya"
						style={styles.monthBtn}
					>
						<Text style={styles.monthBtnText}>›</Text>
					</Pressable>
				</View>

				<View style={styles.card}>
					<View style={styles.weekRow}>
						{WEEK_HEADERS.map((h) => (
							<Text key={h} style={styles.weekHead}>
								{h}
							</Text>
						))}
					</View>
					{monthMatrix(cursor.year, cursor.month).map((week, wi) => (
						<View key={wi} style={styles.weekRow}>
							{week.map((iso) => {
								const date = parseLocalDate(iso);
								const inMonth = date.getMonth() === cursor.month;
								const isLibur = liburSet.has(iso);
								const hasEvent = eventSet.has(iso);
								const isToday = iso === todayIso;
								const isSelected = iso === selected;
								return (
									<Pressable
										key={iso}
										onPress={() => setSelected(iso)}
										accessibilityRole="button"
										accessibilityLabel={formatLongDate(iso)}
										style={[
											styles.dayCell,
											!inMonth && styles.dayOutside,
											isLibur && !isSelected && styles.dayLibur,
											isToday && !isSelected && styles.dayToday,
											isSelected && styles.daySelected,
										]}
									>
										<Text
											style={[
												styles.dayNumber,
												!inMonth && styles.dayNumberOutside,
												isSelected && styles.dayNumberSelected,
											]}
										>
											{date.getDate()}
										</Text>
										{hasEvent ? (
											<View style={[styles.dot, isSelected && styles.dotSelected]} />
										) : null}
									</Pressable>
								);
							})}
						</View>
					))}
					<View style={styles.legendRow}>
						<View style={styles.legendItem}>
							<View style={styles.legendSwatchLibur} />
							<Text style={styles.legendText}>Libur</Text>
						</View>
						<View style={styles.legendItem}>
							<View style={[styles.legendSwatchDot, { backgroundColor: colors.warning }]} />
							<Text style={styles.legendText}>Ultah / anniversary</Text>
						</View>
					</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>{formatLongDate(selected)}</Text>
					{selectedRoster ? (
						<View style={styles.dayLine}>
							<View style={{ flex: 1 }}>
								<Text style={styles.rowTitle}>
									{selectedRoster.name} ({selectedRoster.code})
								</Text>
								{selectedRoster.checkInTime && selectedRoster.checkOutTime ? (
									<Text style={styles.meta}>
										{selectedRoster.checkInTime}–{selectedRoster.checkOutTime}
										{selectedRoster.overnight ? " · lintas hari" : ""}
									</Text>
								) : null}
							</View>
							{liburSet.has(selected) ? <StatusChip label="Libur" tone="warning" /> : null}
						</View>
					) : (
						<Text style={styles.meta}>Tidak ada jadwal untuk tanggal ini.</Text>
					)}
					{selectedEvents.map((e) => (
						<Text key={`${e.kind}-${e.employeeNumber}`} style={styles.eventRow}>
							{e.kind === "ULTAH" ? "🎂" : "🏅"} {e.fullName} — {e.info}
						</Text>
					))}
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Libur bulan ini</Text>
					{liburDates.length === 0 ? (
						<Text style={styles.meta}>Tidak ada hari libur terjadwal bulan ini.</Text>
					) : (
						liburDates.map((iso) => (
							<View key={iso} style={styles.listRow}>
								<Text style={styles.rowTitle}>{formatDate(iso)}</Text>
								<StatusChip label="Libur" tone="warning" />
							</View>
						))
					)}
					{assignments.length > 0 ? (
						<>
							<Text style={[styles.cardTitle, styles.mt]}>Kalender kerja aktif</Text>
							{assignments.map((a) => (
								<Text key={`${a.calendar}-${a.start}`} style={styles.meta}>
									{a.calendar} · {formatDate(a.start)}
									{a.end ? ` – ${formatDate(a.end)}` : " · berjalan"}
								</Text>
							))}
						</>
					) : null}
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Ultah & anniversary (7 hari)</Text>
					{events.length === 0 ? (
						<Text style={styles.meta}>Tidak ada peristiwa untuk 7 hari ke depan.</Text>
					) : (
						events.map((e) => (
							<View key={`${e.kind}-${e.employeeNumber}`} style={styles.listRow}>
								<Text style={styles.rowTitle}>
									{e.kind === "ULTAH" ? "🎂" : "🏅"} {e.fullName}
								</Text>
								<Text style={styles.meta}>
									{e.info} · {formatDate(e.date)}
								</Text>
							</View>
						))
					)}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	monthNav: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: spacing.xs,
	},
	monthBtn: {
		minWidth: TOUCH_MIN,
		minHeight: TOUCH_MIN,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	monthBtnText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.primary },
	monthLabel: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
	mt: { marginTop: spacing.sm },
	weekRow: { flexDirection: "row" },
	weekHead: {
		flex: 1,
		textAlign: "center",
		fontSize: fontSize.xs,
		fontWeight: "600",
		color: colors.textMuted,
		marginBottom: spacing.xs,
	},
	dayCell: {
		flex: 1,
		minHeight: TOUCH_MIN - 4,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.sm,
		margin: 1,
		gap: 1,
	},
	dayOutside: { opacity: 0.35 },
	dayLibur: { backgroundColor: colors.warningLight },
	dayToday: { borderWidth: 1.5, borderColor: colors.primary },
	daySelected: { backgroundColor: colors.primary },
	dayNumber: { fontSize: fontSize.xs, color: colors.text },
	dayNumberOutside: { color: colors.textMuted },
	dayNumberSelected: { color: colors.textInverse, fontWeight: "700" },
	dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.warning },
	dotSelected: { backgroundColor: colors.textInverse },
	legendRow: {
		flexDirection: "row",
		gap: spacing.lg,
		marginTop: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		paddingTop: spacing.sm,
	},
	legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
	legendSwatchLibur: {
		width: 12,
		height: 12,
		borderRadius: 3,
		backgroundColor: colors.warningLight,
		borderWidth: 1,
		borderColor: colors.warning,
	},
	legendSwatchDot: { width: 8, height: 8, borderRadius: 4 },
	legendText: { fontSize: fontSize.xs, color: colors.textMuted },
	dayLine: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	rowTitle: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
	meta: { fontSize: fontSize.xs, color: colors.textMuted },
	eventRow: { fontSize: fontSize.xs, color: colors.text },
	listRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.sm,
		paddingVertical: spacing.xs,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
});
