import { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { StatusChip } from "@/core/widgets/status-chip";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { useInboxApproval, usePutusanApproval } from "../providers/approval-queries";
import { labelTipeApproval, type InboxApproval } from "../data/approval-api";
import { ApiException } from "@/core/network/api-exception";

/**
 * Persetujuan manajer — P4-4. Setuju/tolak + catatan dari HP;
 * master/payroll tetap read-only (tak ada layar kelola di mobile).
 */
export function ApprovalScreen() {
	const inbox = useInboxApproval();
	const putusan = usePutusanApproval();
	const [catatan, setCatatan] = useState<Record<string, string>>({});

	function kirim(item: InboxApproval, keputusan: "SETUJU" | "TOLAK") {
		const note = (catatan[item.id] ?? "").trim();
		if (keputusan === "TOLAK" && !note) {
			Alert.alert("Catatan wajib", "Isi alasan penolakan sebelum menolak.");
			return;
		}
		const lanjut = () =>
			putusan.mutate(
				{ type: item.type, id: item.id, keputusan, catatan: note || undefined },
				{
					onSuccess: (hasil) => {
						Alert.alert("Berhasil", hasil.message);
						setCatatan((prev) => {
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
		if (keputusan === "SETUJU") {
			Alert.alert("Setujui pengajuan?", `${item.nomor} • ${item.ringkasan}`, [
				{ text: "Batal", style: "cancel" },
				{ text: "Setuju", onPress: lanjut },
			]);
		} else {
			lanjut();
		}
	}

	if (inbox.isPending)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Persetujuan" subtitle="Memuat…" />
				<SkeletonLayar jumlah={3} judul={false} />
			</View>
		);
	if (inbox.isError && inbox.data === undefined)
		return <ErrorView message="Gagal memuat antrean." onRetry={() => void inbox.refetch()} />;

	const items = inbox.data ?? [];

	return (
		<View style={styles.layar}>
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
							<Text style={styles.tipe}>{labelTipeApproval(item.type)}</Text>
							<StatusChip label={`Tahap ${item.tahap} · Menunggu`} tone="warning" />
						</View>
						<Text style={styles.nama}>
							{item.karyawanNama} <Text style={styles.nomor}>({item.nomorKaryawan})</Text>
						</Text>
						<Text style={styles.nomorPengajuan}>{item.nomor}</Text>
						<Text style={styles.ringkasan}>{item.ringkasan}</Text>
						<AppTextField
							label="Catatan (wajib saat menolak)"
							placeholder="cth. Sesuaikan tanggal dinas"
							value={catatan[item.id] ?? ""}
							onChangeText={(text) => setCatatan((prev) => ({ ...prev, [item.id]: text }))}
						/>
						<View style={styles.aksi}>
							<View style={styles.tombol}>
								<AppButton
									label="Setuju"
									loading={putusan.isPending}
									onPress={() => kirim(item, "SETUJU")}
								/>
							</View>
							<View style={styles.tombol}>
								<AppButton
									label="Tolak"
									variant="danger"
									loading={putusan.isPending}
									onPress={() => kirim(item, "TOLAK")}
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
	layar: { flex: 1, backgroundColor: colors.background },
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
	tipe: { fontSize: fontSize.sm, fontWeight: "700", color: colors.primary },
	nama: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
	nomor: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "400" },
	nomorPengajuan: { fontSize: fontSize.xs, color: colors.textMuted },
	ringkasan: { fontSize: fontSize.sm, color: colors.text },
	aksi: { flexDirection: "row", gap: spacing.sm },
	tombol: { flex: 1 },
	gap: { height: spacing.sm },
});
