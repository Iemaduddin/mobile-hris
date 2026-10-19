import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { formatDate } from "@/core/util/format";
import { useAnnouncements } from "../providers/announcements-queries";

/** Company announcements + this week's events (birthdays/anniversaries). */
export function AnnouncementsScreen() {
	const { data, isPending, isError, isFetching, refetch } = useAnnouncements();

	if (isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Announcement" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (isError || !data)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Announcement" />
				<ErrorView message="Gagal memuat pengumuman." onRetry={() => void refetch()} />
			</View>
		);

	const events = data.events;

	return (
		<View style={styles.screen}>
			<ScreenHeader
				title="Announcement"
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
					events.length > 0 ? (
						<View style={styles.week}>
							<Text style={styles.weekTitle}>Minggu ini</Text>
							{events.slice(0, 5).map((p) => (
								<Text key={`${p.kind}-${p.employeeNumber}`} style={styles.weekRow}>
									{p.kind === "ULTAH" ? "🎂" : "🏅"} {p.fullName} — {p.info}
								</Text>
							))}
						</View>
					) : null
				}
				ListEmptyComponent={<EmptyView message="Belum ada pengumuman untuk Anda." />}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.title}>{item.title}</Text>
							{item.unitName ? <Text style={styles.unit}>{item.unitName}</Text> : null}
						</View>
						<Text style={styles.body}>{item.body}</Text>
						<Text style={styles.time}>{formatDate(item.startsAt)}</Text>
					</View>
				)}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	week: {
		backgroundColor: colors.warningLight,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.warning,
		padding: spacing.md,
		gap: spacing.xs,
		marginBottom: spacing.sm,
	},
	weekTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	weekRow: { fontSize: fontSize.xs, color: colors.text },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	title: { flex: 1, fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	unit: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: "700" },
	body: { fontSize: fontSize.sm, color: colors.text },
	time: { fontSize: fontSize.xs, color: colors.textMuted },
	gap: { height: spacing.sm },
});
