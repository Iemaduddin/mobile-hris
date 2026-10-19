import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { ErrorView } from "@/core/widgets/states";
import { formatIDR } from "@/core/util/format";
import { getPeriodLabel, groupPayslipLines } from "../models/payslips";
import { usePayslipDetail } from "../providers/payslips-queries";

type Row = { label: string; value: string; bold?: boolean };

/**
 * One payslips's detail (mobile PRD Bag. 5.5): earnings, deductions,
 * and contributions (company vs employee) per the backend `lines`.
 */
export function PayslipDetailScreen({ number }: { number: string }) {
	const slip = usePayslipDetail(number);

	if (slip.isPending)
		return (
			<View style={styles.wrap}>
				<ScreenHeader title="Slip Gaji" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (slip.isError || !slip.data)
		return (
			<View style={styles.wrap}>
				<ScreenHeader title="Slip Gaji" />
				<ErrorView
					message="Slip tidak ditemukan atau tidak dapat dimuat."
					onRetry={() => void slip.refetch()}
				/>
			</View>
		);

	const data = slip.data;
	const groups = groupPayslipLines(data.lines);

	const summary: Row[] = [
		{ label: "Gaji pokok", value: formatIDR(data.baseSalary) },
		{ label: "Total pendapatan", value: formatIDR(data.totalEarnings) },
		{ label: "Total potongan", value: formatIDR(data.totalDeductions) },
		{ label: "Hari hadir", value: `${data.presentDays} hari` },
		{ label: "Hari alpa", value: `${data.absentDays} hari` },
	];

	return (
		<View style={styles.wrap}>
			<ScreenHeader title={getPeriodLabel(data.period)} subtitle={data.number} />
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.hero}>
					<Text style={styles.heroLabel}>Gaji bersih</Text>
					<Text style={styles.heroValue}>{formatIDR(data.netPay)}</Text>
					<Text style={styles.heroMeta}>
						{data.employeeName} · {data.employeeNumber}
					</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Ringkasan</Text>
					{summary.map((r, index) => (
						<View key={r.label} style={[styles.row, index > 0 && styles.rowBorder]}>
							<Text style={styles.rowLabel}>{r.label}</Text>
							<Text style={[styles.rowValue, r.bold && styles.rowBold]}>{r.value}</Text>
						</View>
					))}
				</View>

				{groups.map((g) => (
					<View key={g.group} style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.cardTitle}>{g.label}</Text>
							<Text style={styles.cardSubtotal}>{formatIDR(g.subtotal)}</Text>
						</View>
						{g.items.map((item, index) => (
							<View key={item.code} style={[styles.row, index > 0 && styles.rowBorder]}>
								<View style={styles.itemLeft}>
									<Text style={styles.rowLabel}>{item.name}</Text>
									{item.description ? <Text style={styles.description}>{item.description}</Text> : null}
								</View>
								<Text style={styles.rowValue}>{formatIDR(item.amount)}</Text>
							</View>
						))}
					</View>
				))}

				<Text style={styles.note}>Slip ini hanya terlihat oleh Anda.</Text>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },

	hero: {
		backgroundColor: colors.primaryLight,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.primary,
		padding: spacing.lg,
		alignItems: "center",
		gap: spacing.xs,
	},
	heroLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.primaryDark },
	heroValue: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.primaryDark },
	heroMeta: { fontSize: fontSize.xs, color: colors.textMuted },

	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
	},
	cardHead: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.sm,
		marginBottom: spacing.xs,
	},
	cardTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	cardSubtotal: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		paddingVertical: spacing.sm,
		minHeight: 36,
	},
	rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
	itemLeft: { flex: 1, gap: 2 },
	rowLabel: { flex: 1, fontSize: fontSize.sm, color: colors.text },
	rowValue: { fontSize: fontSize.sm, color: colors.text, fontVariant: ["tabular-nums"] },
	rowBold: { fontWeight: "700" },
	description: { fontSize: fontSize.xs, color: colors.textMuted },
	note: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: "center" },
});
