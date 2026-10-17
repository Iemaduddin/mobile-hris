import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { formatDate } from "@/core/util/format";
import { AppButton } from "@/core/widgets/app-button";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import {
	useDutyRequests,
	useLeaveBalance,
	useLeaveRequests,
	useOvertimeRequests,
} from "../providers/requests-queries";
import {
	REQUEST_KINDS,
	FILTER_STATUS,
	getRequestKindLabel,
	type DutyRequest,
	type LeaveRequest,
	type OvertimeRequest,
	type RequestKind,
} from "../models/request";
import { RequestCard, type RequestCardData } from "./request-card";

const CURRENT_YEAR = new Date().getFullYear();

const INITIAL_LIMIT = 20;
const LIMIT_STEP = 20;

function toLeaveCard(x: LeaveRequest): RequestCardData {
	return {
		id: x.id,
		kind: "leave",
		status: x.status,
		number: x.number,
		title: x.leaveTypeName,
		range: `${formatDate(x.startDate)} – ${formatDate(x.endDate)}`,
		note: `${x.totalDays} hari${x.usesBalance ? " · memakai saldo" : ""}`,
	};
}

function toOvertimeCard(x: OvertimeRequest): RequestCardData {
	return {
		id: x.id,
		kind: "overtime",
		status: x.status,
		title: "Lembur",
		range: `${formatDate(x.date)} · ${x.startTime}–${x.endTime}`,
		note: `${x.totalHours} jam · ${x.reason}`,
	};
}

function toDutyCard(x: DutyRequest): RequestCardData {
	return {
		id: x.id,
		kind: "duty",
		status: x.status,
		number: x.number,
		title: x.dutyType === "WFH" ? "WFH" : "Dinas Luar",
		range: `${formatDate(x.startDate)} – ${formatDate(x.endDate)}`,
		note: x.location ?? undefined,
	};
}

/**
 * Requests tab — leave/overtime/duty lists + balance (mobile PRD Bag. 5.4).
 * Create & detail screens live stacked under `src/app/requests/`.
 */
export function RequestsScreen() {
	const [kind, setKind] = useState<RequestKind>("leave");
	const [status, setStatus] = useState("");
	const [limit, setLimit] = useState(INITIAL_LIMIT);

	const balance = useLeaveBalance(CURRENT_YEAR);
	const leaveQuery = useLeaveRequests(status);
	const overtimeQuery = useOvertimeRequests(status);
	const dutyQuery = useDutyRequests(status);

	function selectKind(k: RequestKind) {
		setKind(k);
		setLimit(INITIAL_LIMIT);
	}

	function selectStatus(s: string) {
		setStatus(s);
		setLimit(INITIAL_LIMIT);
	}

	const active = kind === "leave" ? leaveQuery : kind === "overtime" ? overtimeQuery : dutyQuery;

	if (active.isPending)
		return (
			<SafeAreaView style={styles.safe} edges={["top"]}>
				<ScreenSkeleton count={5} />
			</SafeAreaView>
		);
	if (active.isError && active.data === undefined)
		return <ErrorView message="Gagal memuat daftar pengajuan." onRetry={() => void active.refetch()} />;

	const cards =
		kind === "leave"
			? (leaveQuery.data ?? []).map(toLeaveCard)
			: kind === "overtime"
				? (overtimeQuery.data ?? []).map(toOvertimeCard)
				: (dutyQuery.data ?? []).map(toDutyCard);

	const visibleCards = cards.slice(0, limit);
	const remaining = cards.length - visibleCards.length;

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<FlatList
				data={visibleCards}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={active.isRefetching}
						onRefresh={() => void active.refetch()}
						tintColor={colors.primary}
					/>
				}
				ListHeaderComponent={
					<View style={styles.head}>
						<Text style={styles.title}>Pengajuan</Text>
						<BalanceCard rows={balance.data?.balance ?? []} loading={balance.isPending} />
						<View style={styles.segmented}>
							{REQUEST_KINDS.map((k) => (
								<Pressable
									key={k}
									onPress={() => selectKind(k)}
									accessibilityRole="tab"
									accessibilityState={{ selected: kind === k }}
									style={[styles.seg, kind === k ? styles.segActive : null]}
								>
									<Text style={[styles.segText, kind === k ? styles.segTextActive : null]}>
										{getRequestKindLabel(k)}
									</Text>
								</Pressable>
							))}
						</View>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.chips}
						>
							{FILTER_STATUS.map((f) => (
								<Pressable
									key={f.value}
									onPress={() => selectStatus(f.value)}
									accessibilityRole="button"
									style={[styles.chip, status === f.value ? styles.chipActive : null]}
								>
									<Text
										style={[styles.chipText, status === f.value ? styles.chipTextActive : null]}
									>
										{f.label}
									</Text>
								</Pressable>
							))}
						</ScrollView>
					</View>
				}
				ListEmptyComponent={
					<EmptyView
						message={`Belum ada pengajuan ${getRequestKindLabel(kind).toLowerCase()}${
							status ? " dengan filter ini" : ""
						}.`}
					/>
				}
				renderItem={({ item }) => (
					<RequestCard
						data={item}
						onPress={() =>
							router.push({ pathname: "/requests/detail", params: { id: item.id, kind: item.kind } })
						}
					/>
				)}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
				ListFooterComponent={
					remaining > 0 ? (
						<View style={styles.loadMore}>
							<AppButton
								label={`Muat lagi (${remaining} tersisa)`}
								variant="outline"
								onPress={() => setLimit((b) => b + LIMIT_STEP)}
							/>
						</View>
					) : null
				}
			/>
			<View style={styles.footer}>
				<AppButton
					label="Buat Baru"
					onPress={() => router.push({ pathname: "/requests/new", params: { kind } })}
				/>
			</View>
		</SafeAreaView>
	);
}

function BalanceCard({
	rows,
	loading,
}: {
	rows: { leaveTypeName: string; closingBalance: string; year: number }[];
	loading: boolean;
}) {
	if (loading || rows.length === 0) return null;

	return (
		<View style={styles.balanceCard}>
			<Text style={styles.balanceTitle}>Sisa saldo cuti {rows[0].year}</Text>
			{rows.map((r) => (
				<View key={r.leaveTypeName} style={styles.balanceRow}>
					<Text style={styles.balanceName}>{r.leaveTypeName}</Text>
					<Text style={styles.balanceValue}>{r.closingBalance} hari</Text>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	head: { gap: spacing.md, marginBottom: spacing.sm },
	title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },

	balanceCard: {
		backgroundColor: colors.primaryLight,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.primary,
		padding: spacing.md,
		gap: spacing.xs,
	},
	balanceTitle: { fontSize: fontSize.xs, fontWeight: "700", color: colors.primaryDark },
	balanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	balanceName: { fontSize: fontSize.sm, color: colors.text },
	balanceValue: { fontSize: fontSize.sm, fontWeight: "700", color: colors.primaryDark },

	segmented: {
		flexDirection: "row",
		backgroundColor: colors.backgroundAlt,
		borderRadius: radius.full,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 3,
		gap: 3,
	},
	seg: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
	segActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
	segText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
	segTextActive: { color: colors.primary },

	chips: { gap: spacing.xs, paddingRight: spacing.sm },
	chip: {
		minHeight: 32,
		justifyContent: "center",
		paddingHorizontal: spacing.md,
		borderRadius: radius.full,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
	chipText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "600" },
	chipTextActive: { color: colors.textInverse },

	gap: { height: spacing.sm },
	loadMore: { paddingVertical: spacing.sm },
	footer: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		backgroundColor: colors.background,
	},
});
