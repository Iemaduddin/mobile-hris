import { useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { DateField } from "@/features/requests/presentation/form-fields";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { ApiException } from "@/core/network/api-exception";
import { formatDate, formatIDR } from "@/core/util/format";
import { estimateInstallment, type MySalaryAdvance } from "../data/salary-advances-api";
import { getSalaryAdvanceStatusLabel, getSalaryAdvanceStatusTone } from "../models/salary-advances";
import { useCreateSalaryAdvance, useMySalaryAdvances, useSalaryAdvanceAction } from "../providers/salary-advances-queries";

const TENOR_OPTIONS = [3, 6, 10, 12, 24];

function progress(installmentNo: number, tenorMonths: number): number {
	if (!tenorMonths || tenorMonths <= 0) return 0;
	return Math.min(1, Math.max(0, installmentNo / tenorMonths));
}

/**
 * My Salary Advances — M-ESS-2. Installment preview before sending;
 * repayment is auto-deducted from each salary run.
 */
export function SalaryAdvancesScreen() {
	const employee = useAuthStore((s) => s.employee);
	const list = useMySalaryAdvances();
	const create = useCreateSalaryAdvance();
	const action = useSalaryAdvanceAction();

	const [amount, setAmount] = useState("");
	const [tenor, setTenor] = useState(10);
	const [customTenor, setCustomTenor] = useState("");
	const [deductionStart, setDeductionStart] = useState("");
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);

	const busy = create.isPending || action.isPending;
	const amountValue = Number(String(amount).replace(/[^0-9]/g, ""));
	const activeTenor = customTenor.trim() ? Number(customTenor) : tenor;
	const installment = estimateInstallment(amountValue, activeTenor);

	function getErrorMessage(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	function submit() {
		if (!employee) {
			setError("Akun belum tertaut ke data karyawan.");
			return;
		}
		if (!Number.isFinite(amountValue) || amountValue <= 0) {
			setError("Nominal harus lebih dari 0.");
			return;
		}
		if (!Number.isFinite(activeTenor) || activeTenor < 1) {
			setError("Tenor minimal 1 bulan.");
			return;
		}
		if (!reason.trim()) {
			setError("Alasan wajib diisi.");
			return;
		}
		setError(null);
		create.mutate(
			{ amount: amountValue, tenorMonths: Math.floor(activeTenor), deductionStart, reason: reason.trim() },
			{
				onSuccess: async (draft) => {
					try {
						await action.mutateAsync({ id: draft.id, action: "submit" });
						Alert.alert("Terkirim", "Pengajuan kasbon diteruskan ke Finance.");
					} catch (err) {
						Alert.alert("Draf tersimpan", `Gagal mengajukan otomatis: ${getErrorMessage(err)}`);
					}
					setAmount("");
					setCustomTenor("");
					setDeductionStart("");
					setReason("");
				},
				onError: (err) => setError(getErrorMessage(err)),
			},
		);
	}

	if (list.isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="SalaryAdvance Saya" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (list.isError && list.data === undefined)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="SalaryAdvance Saya" />
				<ErrorView message="Gagal memuat kasbon." onRetry={() => void list.refetch()} />
			</View>
		);

	const items = list.data ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader title="SalaryAdvance Saya" subtitle={items.length > 0 ? `${items.length} pengajuan` : undefined} />
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={list.isRefetching}
						onRefresh={() => void list.refetch()}
						tintColor={colors.primary}
					/>
				}
				ListHeaderComponent={
					<View style={styles.form}>
						<Text style={styles.formTitle}>Pengajuan Baru</Text>
						<Text style={styles.formSubtitle}>Dicicil otomatis potong gaji tiap run.</Text>

						<AppTextField
							label="Nominal (Rp)"
							value={amount}
							onChangeText={setAmount}
							keyboardType="numeric"
							placeholder="cth. 10000000"
						/>

						<Text style={styles.fieldLabel}>Tenor (bulan)</Text>
						<View style={styles.chips}>
							{TENOR_OPTIONS.map((t) => (
								<Pressable
									key={t}
									onPress={() => {
										setTenor(t);
										setCustomTenor("");
									}}
									accessibilityRole="button"
									accessibilityState={{ selected: !customTenor && tenor === t }}
									style={[styles.chip, !customTenor && tenor === t && styles.chipActive]}
								>
									<Text style={[styles.chipText, !customTenor && tenor === t && styles.chipTextActive]}>
										{t}x
									</Text>
								</Pressable>
							))}
						</View>
						<AppTextField
							label="Tenor lain (opsional)"
							value={customTenor}
							onChangeText={setCustomTenor}
							keyboardType="numeric"
							placeholder="cth. 8"
						/>

						<DateField label="Mulai potong" value={deductionStart} onChange={setDeductionStart} />

						<AppTextField
							label="Alasan"
							value={reason}
							onChangeText={setReason}
							placeholder="cth. Biaya sekolah anak"
						/>

						{installmentPreview(amountValue, activeTenor, installment)}

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<AppButton label="Kirim Pengajuan" onPress={submit} loading={busy} />
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada pengajuan kasbon." />}
				renderItem={({ item }) => (
					<SalaryAdvanceCard
						data={item}
						busy={busy}
						onSubmit={() =>
							action.mutate(
								{ id: item.id, action: "submit" },
								{ onError: (e) => Alert.alert("Gagal", getErrorMessage(e)) },
							)
						}
						onCancel={() =>
							action.mutate(
								{ id: item.id, action: "cancel" },
								{ onError: (e) => Alert.alert("Gagal", getErrorMessage(e)) },
							)
						}
					/>
				)}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

function installmentPreview(amount: number, tenor: number, installment: number) {
	if (!Number.isFinite(amount) || amount <= 0 || installment <= 0) return null;
	return (
		<View style={styles.preview}>
			<Text style={styles.previewLabel}>Estimasi cicilan</Text>
			<Text style={styles.previewValue}>
				{formatIDR(installment)} × {Math.floor(tenor)} bln
			</Text>
		</View>
	);
}

function SalaryAdvanceCard({
	data,
	busy,
	onSubmit,
	onCancel,
}: {
	data: MySalaryAdvance;
	busy: boolean;
	onSubmit: () => void;
	onCancel: () => void;
}) {
	const p = progress(data.installmentNo, data.tenorMonths);
	return (
		<View style={styles.card}>
			<View style={styles.cardHead}>
				<Text style={styles.number} numberOfLines={1}>
					{data.number}
				</Text>
				<StatusChip label={getSalaryAdvanceStatusLabel(data.status)} tone={getSalaryAdvanceStatusTone(data.status)} />
			</View>
			<Text style={styles.amountLarge}>{formatIDR(data.amount)}</Text>
			<Text style={styles.meta}>
				{formatIDR(data.monthlyInstallment)}/bln · {data.installmentNo}/{data.tenorMonths} cicilan · mulai{" "}
				{formatDate(data.deductionStart)}
			</Text>
			<Text style={styles.meta}>Sisa: {formatIDR(data.remainingDebt)}</Text>
			<View style={styles.progressBar}>
				<View style={[styles.fill, { flex: p }]} />
				<View style={{ flex: 1 - p }} />
			</View>
			{data.note ? <Text style={styles.note}>“{data.note}”</Text> : null}
			{data.status === "DRAFT" ? (
				<View style={styles.actionRow}>
					<View style={styles.actionButton}>
						<AppButton label="Ajukan" onPress={onSubmit} loading={busy} />
					</View>
					<View style={styles.actionButton}>
						<AppButton label="Batal" variant="outline" onPress={onCancel} loading={busy} />
					</View>
				</View>
			) : null}
			{data.status === "DIAJUKAN" ? (
				<View style={styles.actionRow}>
					<View style={styles.actionButton}>
						<AppButton label="Batalkan" variant="outline" onPress={onCancel} loading={busy} />
					</View>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	form: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
		marginBottom: spacing.sm,
	},
	formTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	formSubtitle: { fontSize: fontSize.xs, color: colors.textMuted },
	fieldLabel: { fontSize: fontSize.sm, color: colors.textMuted },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
	chip: {
		minHeight: 38,
		minWidth: 56,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.md,
		borderRadius: radius.full,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
	chipText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
	chipTextActive: { color: colors.textInverse },
	preview: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: colors.primaryLight,
		borderRadius: radius.md,
		padding: spacing.md,
	},
	previewLabel: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: "700" },
	previewValue: { fontSize: fontSize.sm, fontWeight: "800", color: colors.primaryDark },
	error: { fontSize: fontSize.xs, color: colors.danger },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	number: { flex: 1, fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	amountLarge: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
	meta: { fontSize: fontSize.xs, color: colors.textMuted },
	progressBar: { flexDirection: "row", height: 8, borderRadius: 4, backgroundColor: colors.backgroundAlt, overflow: "hidden" },
	fill: { backgroundColor: colors.success },
	note: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: "italic" },
	actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	actionButton: { flex: 1 },
	gap: { height: spacing.sm },
});
