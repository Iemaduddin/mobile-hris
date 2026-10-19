import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { formatIDR } from "@/core/util/format";
import { getPeriodLabel, type MyPayslip } from "../models/payslips";
import { usePayslipList } from "../providers/payslips-queries";

/**
 * Owned payslips list (mobile PRD Bag. 5.5).
 * Only published periods appear — filtered server-side.
 */
export function PayslipListScreen() {
	const slips = usePayslipList();

	if (slips.isPending)
		return (
			<View style={styles.wrap}>
				<ScreenHeader title="Slip Gaji" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (slips.isError && slips.data === undefined)
		return <ErrorView message="Gagal memuat daftar slip gaji." onRetry={() => void slips.refetch()} />;

	return (
		<View style={styles.wrap}>
			<ScreenHeader title="Slip Gaji" />
			<FlatList
				data={slips.data ?? []}
				keyExtractor={(item) => item.number}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={slips.isRefetching}
						onRefresh={() => void slips.refetch()}
						tintColor={colors.primary}
					/>
				}
				ListEmptyComponent={<EmptyView message="Belum ada slip gaji yang diterbitkan." />}
				renderItem={({ item }) => <SlipCard slip={item} />}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

function SlipCard({ slip }: { slip: MyPayslip }) {
	return (
		<Pressable
			onPress={() => router.push({ pathname: "/payslips/detail", params: { number: slip.number } })}
			accessibilityRole="button"
			accessibilityLabel={`Slip gaji ${getPeriodLabel(slip.period)}`}
			style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
		>
			<View style={styles.cardLeft}>
				<Text style={styles.period}>{getPeriodLabel(slip.period)}</Text>
				<Text style={styles.number}>{slip.number}</Text>
			</View>
			<View style={styles.cardRight}>
				<Text style={styles.net}>{formatIDR(slip.netPay)}</Text>
				<Text style={styles.open}>Lihat rincian ›</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	wrap: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	card: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.lg,
		padding: spacing.lg,
	},
	cardPressed: { backgroundColor: colors.backgroundAlt },
	cardLeft: { flex: 1, gap: spacing.xs },
	cardRight: { alignItems: "flex-end", gap: spacing.xs },
	period: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	number: { fontSize: fontSize.xs, color: colors.textMuted },
	net: { fontSize: fontSize.lg, fontWeight: "700", color: colors.success },
	open: { fontSize: fontSize.xs, color: colors.primary },
	gap: { height: spacing.sm },
});
