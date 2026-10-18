import { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { StatusChip } from "@/core/widgets/status-chip";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { useApprovalDecision, useApprovalInbox } from "../providers/approval-queries";
import { getApprovalTypeLabel, type ApprovalInboxItem } from "../data/approval-api";
import { ApiException } from "@/core/network/api-exception";
import { formatDate, formatIDR } from "@/core/util/format";

/**
 * Manager approvals — P4-4. Approve/reject + note from the phone;
 * master/payroll stay read-only (no management screens on mobile).
 */
export function ApprovalScreen() {
	const inbox = useApprovalInbox();
	const decision = useApprovalDecision();
	const [notes, setNotes] = useState<Record<string, string>>({});

	function decide(item: ApprovalInboxItem, verdict: "SETUJU" | "TOLAK") {
		const note = (notes[item.id] ?? "").trim();
		if (verdict === "TOLAK" && !note) {
			Alert.alert("Catatan wajib", "Isi alasan penolakan sebelum menolak.");
			return;
		}
		const proceed = () =>
			decision.mutate(
				{ type: item.type, id: item.id, decision: verdict, note: note || undefined },
				{
					onSuccess: (result) => {
						Alert.alert("Berhasil", result.message);
						setNotes((prev) => {
							const next = { ...prev };
							delete next[item.id];
							return next;
						});
					},
					onError: (error) => {
						Alert.alert(
							"Gagal",
							error instanceof ApiException ? error.message : "Tidak dapat memproses.",
						);
					},
				},
			);
		if (verdict === "SETUJU") {
			Alert.alert("Setujui pengajuan?", `${item.number} • ${item.summary}`, [
				{ text: "Batal", style: "cancel" },
				{ text: "Setuju", onPress: proceed },
			]);
		} else {
			proceed();
		}
	}

	if (inbox.isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Persetujuan" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (inbox.isError && inbox.data === undefined)
		return <ErrorView message="Gagal memuat antrean." onRetry={() => void inbox.refetch()} />;

	const items = inbox.data ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader
				title="Persetujuan"
				subtitle={
					items.length > 0 ? `${items.length} menunggu keputusan Anda` : "Antrean tim — tarik untuk memuat ulang"
				}
			/>
			<FlatList
				data={items}
				keyExtractor={(item) => `${item.type}-${item.id}`}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={inbox.isRefetching}
						onRefresh={() => void inbox.refetch()}
						tintColor={colors.primary}
					/>
				}
				ListEmptyComponent={<EmptyView message="Tidak ada yang menunggu persetujuan." />}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.kind}>{getApprovalTypeLabel(item.type)}</Text>
							<StatusChip label={`Tahap ${item.stage} · Menunggu`} tone="warning" />
						</View>
						<Text style={styles.name}>
							{item.employeeName} <Text style={styles.number}>({item.employeeNumber})</Text>
						</Text>
						<Text style={styles.requestNumber}>{item.number}</Text>
						{item.date || item.amount !== null ? (
							<Text style={styles.meta}>
								{[
									item.date ? formatDate(item.date) : null,
									item.amount !== null ? formatIDR(item.amount) : null,
								]
									.filter(Boolean)
									.join(" · ")}
							</Text>
						) : null}
						<Text style={styles.summary}>{item.summary}</Text>
						<AppTextField
							label="Catatan (wajib saat menolak)"
							placeholder="cth. Sesuaikan tanggal dinas"
							value={notes[item.id] ?? ""}
							onChangeText={(text) => setNotes((prev) => ({ ...prev, [item.id]: text }))}
						/>
						<View style={styles.actions}>
							<View style={styles.button}>
								<AppButton
									label="Setuju"
									loading={decision.isPending}
									onPress={() => decide(item, "SETUJU")}
								/>
							</View>
							<View style={styles.button}>
								<AppButton
									label="Tolak"
									variant="danger"
									loading={decision.isPending}
									onPress={() => decide(item, "TOLAK")}
								/>
							</View>
						</View>
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
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	kind: { fontSize: fontSize.sm, fontWeight: "700", color: colors.primary },
	name: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
	number: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "400" },
	requestNumber: { fontSize: fontSize.xs, color: colors.textMuted },
	meta: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
	summary: { fontSize: fontSize.sm, color: colors.text },
	actions: { flexDirection: "row", gap: spacing.sm },
	button: { flex: 1 },
	gap: { height: spacing.sm },
});
