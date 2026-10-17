import { useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { DateField, Field } from "@/features/requests/presentation/form-fields";
import { ApiException } from "@/core/network/api-exception";
import { formatDate } from "@/core/util/format";
import type { SwapItem } from "../data/tukar-api";
import { getSwapStatusLabel, getSwapStatusTone } from "../models/tukar";
import { useCreateSwap, useMySwaps, useSwapAction, useSwapPartners } from "../providers/tukar-queries";

/**
 * Shift Swap — M-ESS-4. Proposal to a peer (same date),
 * peer approves → HR finalizes, roster swapped atomically.
 */
export function TukarScreen() {
	const list = useMySwaps();
	const partners = useSwapPartners();
	const create = useCreateSwap();
	const action = useSwapAction();

	const [date, setDate] = useState("");
	const [search, setSearch] = useState("");
	const [partnerId, setPartnerId] = useState("");
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);

	const busy = create.isPending || action.isPending;
	const options = (partners.data ?? []).filter((o) =>
		search.trim() ? o.label.toLowerCase().includes(search.trim().toLowerCase()) : true,
	);

	function getErrorMessage(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	function submit() {
		if (!date) {
			setError("Tanggal wajib diisi.");
			return;
		}
		if (!partnerId) {
			setError("Pilih pasangan tukar.");
			return;
		}
		if (!reason.trim()) {
			setError("Alasan wajib diisi.");
			return;
		}
		setError(null);
		create.mutate(
			{ partnerEmployeeId: partnerId, date, reason: reason.trim() },
			{
				onSuccess: async (draft) => {
					try {
						await action.mutateAsync({ id: draft.id, action: "submit" });
						Alert.alert("Terkirim", "Usulan diteruskan ke pasangan → HR.");
					} catch (err) {
						Alert.alert("Draf tersimpan", `Gagal mengajukan otomatis: ${getErrorMessage(err)}`);
					}
					setDate("");
					setPartnerId("");
					setSearch("");
					setReason("");
				},
				onError: (err) => setError(getErrorMessage(err)),
			},
		);
	}

	if (list.isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Tukar Shift" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (list.isError && list.data === undefined)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Tukar Shift" />
				<ErrorView message="Gagal memuat tukar shift." onRetry={() => void list.refetch()} />
			</View>
		);

	const outgoing = list.data?.outgoing ?? [];
	const incoming = list.data?.incoming ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader title="Tukar Shift" subtitle="Tanggal sama · pasangan → HR" />
			<FlatList
				data={[{ key: "form" }]}
				keyExtractor={(item) => item.key}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={list.isRefetching}
						onRefresh={() => void list.refetch()}
						tintColor={colors.primary}
					/>
				}
				renderItem={() => (
					<View style={styles.bigGap}>
						<View style={styles.form}>
							<Text style={styles.formTitle}>Usulan Baru</Text>

							<DateField label="Tanggal" value={date} onChange={setDate} />

							<Field label="Pasangan tukar">
								<AppTextField
									label="Cari karyawan"
									value={search}
									onChangeText={(text) => {
										setSearch(text);
										setPartnerId("");
									}}
									placeholder="Cari nama / nomor…"
								/>
								{partners.isPending ? (
									<Text style={styles.meta}>Memuat daftar karyawan…</Text>
								) : (
									<View style={styles.options}>
										{options.slice(0, 8).map((o) => (
											<Pressable
												key={o.value}
												onPress={() => {
													setPartnerId(o.value);
													setSearch(o.label);
												}}
												accessibilityRole="button"
												style={[styles.optionItem, partnerId === o.value && styles.optionActive]}
											>
												<Text
													style={[styles.optionText, partnerId === o.value && styles.optionTextActive]}
													numberOfLines={1}
												>
													{o.label}
												</Text>
											</Pressable>
										))}
										{options.length > 8 ? (
											<Text style={styles.meta}>+{options.length - 8} lagi — persempit pencarian</Text>
										) : options.length === 0 ? (
											<Text style={styles.meta}>Tidak ketemu.</Text>
										) : null}
									</View>
								)}
							</Field>

							<AppTextField
								label="Alasan"
								value={reason}
								onChangeText={setReason}
								placeholder="cth. Ada acara keluarga"
							/>

							{error ? <Text style={styles.error}>{error}</Text> : null}

							<AppButton label="Kirim Usulan" onPress={submit} loading={busy} />
						</View>

						<Section
							title={`Masuk untuk saya (${incoming.length})`}
							items={incoming}
							empty="Tidak ada usulan masuk."
							busy={busy}
							mode="incoming"
							getErrorMessage={getErrorMessage}
						/>

						<Section
							title={`Usulan saya (${outgoing.length})`}
							items={outgoing}
							empty="Belum ada usulan keluar."
							busy={busy}
							mode="outgoing"
							getErrorMessage={getErrorMessage}
						/>
					</View>
				)}
			/>
		</View>
	);
}

function Section({
	title,
	items,
	empty,
	busy,
	mode,
	getErrorMessage,
}: {
	title: string;
	items: SwapItem[];
	empty: string;
	busy: boolean;
	mode: "incoming" | "outgoing";
	getErrorMessage: (error: unknown) => string;
}) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			{items.length === 0 ? (
				<Text style={styles.meta}>{empty}</Text>
			) : (
				items.map((item) => (
					<SwapCard key={item.id} data={item} busy={busy} mode={mode} getErrorMessage={getErrorMessage} />
				))
			)}
		</View>
	);
}

function SwapCard({
	data,
	busy,
	mode,
	getErrorMessage,
}: {
	data: SwapItem;
	busy: boolean;
	mode: "incoming" | "outgoing";
	getErrorMessage: (error: unknown) => string;
}) {
	const action = useSwapAction();
	const [showReject, setShowReject] = useState(false);
	const [rejectReason, setRejectReason] = useState("");

	function reject() {
		if (!rejectReason.trim()) {
			Alert.alert("Dibatalkan", "Alasan penolakan wajib diisi.");
			return;
		}
		action.mutate(
			{ id: data.id, action: "reject", note: rejectReason.trim() },
			{
				onSuccess: () => {
					setShowReject(false);
					setRejectReason("");
				},
				onError: (e) => Alert.alert("Gagal", getErrorMessage(e)),
			},
		);
	}

	return (
		<View style={styles.card}>
			<View style={styles.cardHead}>
				<Text style={styles.title} numberOfLines={1}>
					{formatDate(data.date)} · {data.peerName}
				</Text>
				<StatusChip label={getSwapStatusLabel(data.status)} tone={getSwapStatusTone(data.status)} />
			</View>
			<Text style={styles.meta}>
				Saya: {data.myShift} ⇄ Lawan: {data.peerShift}
			</Text>
			{mode === "outgoing" && (data.status === "DRAFT" || data.status === "DIAJUKAN") ? (
				<View style={styles.actionRow}>
					{data.status === "DRAFT" ? (
						<View style={styles.actionButton}>
							<AppButton
								label="Ajukan"
								loading={busy || action.isPending}
								onPress={() =>
									action.mutate(
										{ id: data.id, action: "submit" },
										{ onError: (e) => Alert.alert("Gagal", getErrorMessage(e)) },
									)
								}
							/>
						</View>
					) : null}
					<View style={styles.actionButton}>
						<AppButton
							label="Batalkan"
							variant="outline"
							loading={busy || action.isPending}
							onPress={() =>
								action.mutate(
									{ id: data.id, action: "cancel" },
									{ onError: (e) => Alert.alert("Gagal", getErrorMessage(e)) },
								)
							}
						/>
					</View>
				</View>
			) : null}
			{mode === "incoming" && data.status === "DIAJUKAN" ? (
				showReject ? (
					<View style={styles.rejectBox}>
						<AppTextField
							label="Alasan penolakan"
							value={rejectReason}
							onChangeText={setRejectReason}
							placeholder="cth. Jadwal bentrok"
						/>
						<View style={styles.actionRow}>
							<View style={styles.actionButton}>
								<AppButton label="Kirim Tolak" variant="danger" loading={action.isPending} onPress={reject} />
							</View>
							<View style={styles.actionButton}>
								<AppButton label="Batal" variant="outline" onPress={() => setShowReject(false)} />
							</View>
						</View>
					</View>
				) : (
					<View style={styles.actionRow}>
						<View style={styles.actionButton}>
							<AppButton
								label="Setuju"
								loading={busy || action.isPending}
								onPress={() =>
									action.mutate(
										{ id: data.id, action: "approve" },
										{ onError: (e) => Alert.alert("Gagal", getErrorMessage(e)) },
									)
								}
							/>
						</View>
						<View style={styles.actionButton}>
							<AppButton label="Tolak" variant="danger" onPress={() => setShowReject(true)} />
						</View>
					</View>
				)
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	bigGap: { gap: spacing.lg },
	form: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	formTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	options: { gap: spacing.xs, marginTop: spacing.xs },
	optionItem: {
		minHeight: TOUCH_MIN,
		justifyContent: "center",
		paddingHorizontal: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
	optionText: { fontSize: fontSize.sm, color: colors.text },
	optionTextActive: { color: colors.textInverse, fontWeight: "700" },
	error: { fontSize: fontSize.xs, color: colors.danger },
	section: { gap: spacing.sm },
	sectionTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	title: { flex: 1, fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	meta: { fontSize: fontSize.xs, color: colors.textMuted },
	actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	actionButton: { flex: 1 },
	rejectBox: { gap: spacing.sm, marginTop: spacing.xs },
});
