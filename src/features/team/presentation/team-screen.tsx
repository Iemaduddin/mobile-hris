import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { StatusChip } from "@/core/widgets/status-chip";
import { ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { formatLongDate } from "@/core/util/format";
import { useTeam } from "../providers/team-queries";
import type { TeamTodayMember } from "../data/team-api";

/**
 * Tim Saya — M-MGR-2/M-MGR-3. Siapa cuti/dinas hari ini + direktori bawahan
 * (kontak & penempatan saja; data sensitif tetap di web).
 */
export function TeamScreen() {
	const { data, isPending, isError, isFetching, refetch } = useTeam();

	if (isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Tim Saya" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (isError || !data)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Tim Saya" />
				<ErrorView message="Gagal memuat tim." onRetry={() => void refetch()} />
			</View>
		);

	return (
		<View style={styles.screen}>
			<ScreenHeader
				title="Tim Saya"
				subtitle={`${data.count} orang · ${formatLongDate(data.date)}`}
			/>
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
					<Text style={styles.sectionTitle}>Hari ini</Text>
					{data.onLeave.length === 0 ? (
						<Text style={styles.muted}>Semua tim masuk hari ini.</Text>
					) : (
						data.onLeave.map((member) => (
							<View key={member.employeeId} style={styles.leaveRow}>
								<Text style={styles.leaveName}>{member.name}</Text>
								<StatusChip label={member.info ?? "-"} tone="info" />
							</View>
						))
					)}
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Direktori Tim</Text>
					{data.members.length === 0 ? (
						<Text style={styles.muted}>Belum ada anggota tim.</Text>
					) : (
						data.members.map((member) => <MemberRow key={member.employeeId} member={member} />)
					)}
				</View>
			</ScrollView>
		</View>
	);
}

function MemberRow({ member }: { member: TeamTodayMember }) {
	const placement = [member.positionName, member.unitName].filter(Boolean).join(" · ");
	const contact = [member.email, member.phone].filter(Boolean).join(" · ");
	return (
		<View style={styles.member}>
			<Text style={styles.memberName}>
				{member.name} <Text style={styles.memberNumber}>({member.employeeNumber})</Text>
			</Text>
			{placement ? <Text style={styles.muted}>{placement}</Text> : null}
			{contact ? <Text style={styles.muted}>{contact}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.sm,
	},
	sectionTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.primary },
	muted: { fontSize: fontSize.xs, color: colors.textMuted },
	leaveRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	leaveName: { flex: 1, fontSize: fontSize.md, color: colors.text },
	member: { gap: 2, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
	memberName: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
	memberNumber: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "400" },
});
