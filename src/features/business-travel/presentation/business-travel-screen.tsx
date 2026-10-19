import { useState } from "react";
import {
	Alert,
	FlatList,
	Image,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { Field } from "@/features/requests/presentation/form-fields";
import { captureAttachmentPhoto, pickAttachmentImage } from "@/features/requests/data/pick-lampiran";
import { uploadAttachment, type PickedFile } from "@/features/requests/data/requests-api";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { ApiException } from "@/core/network/api-exception";
import { formatIDR } from "@/core/util/format";
import { type MyUangDinas } from "../data/business-travel-api";
import { getUangDinasStatusLabel, getUangDinasStatusTone } from "../models/business-travel";
import {
	useCreateUangDinas,
	useDutyOptions,
	useMyUangDinas,
	useUangDinasAction,
} from "../providers/business-travel-queries";

/**
 * Travel Advances + settlement — M-ESS-6. Advances only from self-owned approved duty;
 * settlement (actuals + mandatory receipt photo) after the advance is approved.
 * Verification stays Finance-side on web.
 */
export function BusinessTravelScreen() {
	const employeeId = useAuthStore((s) => s.employee?.id);
	const list = useMyUangDinas();
	const duty = useDutyOptions();
	const create = useCreateUangDinas();
	const action = useUangDinasAction();

	const [dutyId, setDutyId] = useState("");
	const [searchDuty, setSearchDuty] = useState("");
	const [advanceAmount, setAdvanceAmount] = useState("");
	const [purpose, setPurpose] = useState("");
	const [error, setError] = useState<string | null>(null);

	const busy = create.isPending || action.isPending;
	const dutyOptions = (duty.data ?? []).filter((o) =>
		searchDuty.trim()
			? o.label.toLowerCase().includes(searchDuty.trim().toLowerCase())
			: true,
	);

	function getErrorMessage(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	function submit() {
		if (!dutyId) {
			setError("Pilih dinas yang sudah disetujui.");
			return;
		}
		const value = Number(String(advanceAmount).replace(/[^0-9]/g, ""));
		if (!Number.isFinite(value) || value <= 0) {
			setError("Nominal harus lebih dari 0.");
			return;
		}
		if (!employeeId) {
			setError("Akun belum tertaut ke data karyawan.");
			return;
		}
		setError(null);
		create.mutate(
			{ dutyId, advanceAmount: value, purpose: purpose.trim() },
			{
				onSuccess: async (draft) => {
					try {
						await action.mutateAsync({ id: draft.id, action: "submit" });
						Alert.alert("Terkirim", "Uang muka diteruskan ke atasan → HR.");
					} catch (err) {
						Alert.alert("Draf tersimpan", `Gagal mengajukan otomatis: ${getErrorMessage(err)}`);
					}
					setDutyId("");
					setSearchDuty("");
					setAdvanceAmount("");
					setPurpose("");
				},
				onError: (err) => setError(getErrorMessage(err)),
			},
		);
	}

	if (list.isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Uang Dinas" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (list.isError && list.data === undefined)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Uang Dinas" />
				<ErrorView message="Gagal memuat uang dinas." onRetry={() => void list.refetch()} />
			</View>
		);

	const items = list.data ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader
				title="Uang Dinas"
				subtitle={items.length > 0 ? `${items.length} pengajuan` : undefined}
			/>
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={list.isRefetching}
						onRefresh={() => {
							void list.refetch();
							void duty.refetch();
						}}
						tintColor={colors.primary}
					/>
				}
				ListHeaderComponent={
					<View style={styles.form}>
						<Text style={styles.formTitle}>Minta Uang Muka</Text>
						<Text style={styles.formSubtitle}>Hanya dari dinas yang sudah disetujui.</Text>

						<Field label="Dinas disetujui">
							<AppTextField
								label="Cari nomor dinas"
								value={searchDuty}
								onChangeText={(text) => {
									setSearchDuty(text);
									setDutyId("");
								}}
								placeholder="Cari nomor / tanggal…"
							/>
							{duty.isPending ? (
								<Text style={styles.meta}>Memuat dinas disetujui…</Text>
							) : (
								<View style={styles.options}>
									{dutyOptions.slice(0, 6).map((o) => (
										<Pressable
											key={o.value}
											onPress={() => {
												setDutyId(o.value);
												setSearchDuty(o.label);
											}}
											accessibilityRole="button"
											style={[styles.optionItem, dutyId === o.value && styles.optionActive]}
										>
											<Text
												style={[styles.optionText, dutyId === o.value && styles.optionTextActive]}
												numberOfLines={1}
											>
												{o.label}
											</Text>
										</Pressable>
									))}
									{dutyOptions.length > 6 ? (
										<Text style={styles.meta}>+{dutyOptions.length - 6} lagi — persempit pencarian</Text>
									) : dutyOptions.length === 0 ? (
										<Text style={styles.meta}>Tidak ada dinas disetujui tanpa uang muka.</Text>
									) : null}
								</View>
							)}
						</Field>

						<AppTextField
							label="Nominal muka (Rp)"
							value={advanceAmount}
							onChangeText={setAdvanceAmount}
							keyboardType="numeric"
							placeholder="cth. 2000000"
						/>

						<AppTextField
							label="Keperluan"
							value={purpose}
							onChangeText={setPurpose}
							placeholder="cth. Tiket + penginapan Surabaya"
						/>

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<AppButton label="Kirim Pengajuan" onPress={submit} loading={busy} />
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada pengajuan uang dinas." />}
				renderItem={({ item }) => <TravelAdvanceCard data={item} />}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

function TravelAdvanceCard({ data }: { data: MyUangDinas }) {
	const employeeId = useAuthStore((s) => s.employee?.id);
	const action = useUangDinasAction();
	const [actualInput, setActualInput] = useState("");
	const [file, setFile] = useState<PickedFile | null>(null);
	const [submittingReport, setSubmittingReport] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const busy = action.isPending || submittingReport;

	function getErrorMessage(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	async function pickPhoto(source: "camera" | "gallery") {
		const result = source === "camera" ? await captureAttachmentPhoto() : await pickAttachmentImage();
		if (result.status === "picked") {
			setFile(result.file);
			setError(null);
		} else if (result.status === "permission_denied") {
			Alert.alert("Izin dibutuhkan", "Aktifkan izin kamera/galeri di pengaturan perangkat.");
		} else if (result.status === "too_large") {
			Alert.alert("Terlalu besar", "Ukuran foto maksimal 10 MB.");
		}
	}

	async function submitReport() {
		const value = Number(String(actualInput).replace(/[^0-9]/g, ""));
		if (!Number.isFinite(value) || value < 0) {
			setError("Realisasi tidak valid.");
			return;
		}
		if (!file) {
			setError("Foto nota wajib dilampirkan.");
			return;
		}
		if (!employeeId) {
			setError("Akun belum tertaut ke data karyawan.");
			return;
		}
		setError(null);
		setSubmittingReport(true);
		try {
			const uploaded = await uploadAttachment(file, employeeId);
			await action.mutateAsync({
				id: data.id,
				action: "report",
				actualTotal: value,
				attachmentUrl: uploaded.path,
			});
			Alert.alert("Terkirim", "LPJ dikirim untuk verifikasi Finance.");
			setActualInput("");
			setFile(null);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setSubmittingReport(false);
		}
	}

	return (
		<View style={styles.card}>
			<View style={styles.cardHead}>
				<Text style={styles.number} numberOfLines={1}>
					{data.number}
				</Text>
				<StatusChip label={getUangDinasStatusLabel(data.status)} tone={getUangDinasStatusTone(data.status)} />
			</View>
			<Text style={styles.meta} numberOfLines={1}>
				{data.dutyNumber}
			</Text>
			<Text style={styles.amountLarge}>{formatIDR(data.advanceAmount)}</Text>
			{data.difference !== null ? (
				<Text style={styles.meta}>Selisih: {formatIDR(data.difference)}</Text>
			) : null}

			{data.status === "DRAFT" ? (
				<View style={styles.actionRow}>
					<View style={styles.actionButton}>
						<AppButton
							label="Ajukan"
							onPress={() =>
								action.mutate(
									{ id: data.id, action: "submit" },
									{
										onSuccess: () => Alert.alert("Berhasil", "Pengajuan uang dinas berhasil diajukan."),
										onError: (e) => Alert.alert("Gagal", getErrorMessage(e)),
									},
								)
							}
							loading={busy}
						/>
					</View>
					<View style={styles.actionButton}>
						<AppButton
							label="Batal"
							variant="outline"
							onPress={() =>
								action.mutate(
									{ id: data.id, action: "cancel" },
									{
										onSuccess: () => Alert.alert("Berhasil", "Pengajuan uang dinas berhasil dibatalkan."),
										onError: (e) => Alert.alert("Gagal", getErrorMessage(e)),
									},
								)
							}
							loading={busy}
						/>
					</View>
				</View>
			) : null}
			{data.status === "DIAJUKAN" || data.status === "MENUNGGU_APPROVAL" ? (
				<View style={styles.actionRow}>
					<View style={styles.actionButton}>
						<AppButton
							label="Batalkan"
							variant="outline"
							onPress={() =>
								action.mutate(
									{ id: data.id, action: "cancel" },
									{
										onSuccess: () => Alert.alert("Berhasil", "Pengajuan uang dinas berhasil dibatalkan."),
										onError: (e) => Alert.alert("Gagal", getErrorMessage(e)),
									},
								)
							}
							loading={busy}
						/>
					</View>
				</View>
			) : null}

			{data.status === "DISETUJUI" ? (
				<View style={styles.report}>
					<Text style={styles.reportTitle}>LPJ Realisasi</Text>
					<AppTextField
						label="Total realisasi (Rp)"
						value={actualInput}
						onChangeText={setActualInput}
						keyboardType="numeric"
						placeholder="cth. 1850000"
					/>
					<Field label="Foto nota (wajib)">
						{file ? (
							<View style={styles.preview}>
								<Image source={{ uri: file.uri }} style={styles.photo} resizeMode="cover" />
								<Pressable
									onPress={() => setFile(null)}
									accessibilityRole="button"
									accessibilityLabel="Hapus foto"
									style={styles.removePhoto}
								>
									<Text style={styles.removePhotoText}>✕ Hapus</Text>
								</Pressable>
							</View>
						) : (
							<View style={styles.photoRow}>
								<View style={styles.photoButton}>
									<AppButton label="📷 Kamera" variant="outline" onPress={() => void pickPhoto("camera")} />
								</View>
								<View style={styles.photoButton}>
									<AppButton label="🖼 Galeri" variant="outline" onPress={() => void pickPhoto("gallery")} />
								</View>
							</View>
						)}
					</Field>
					{error ? <Text style={styles.error}>{error}</Text> : null}
					<AppButton label="Kirim LPJ" onPress={() => void submitReport()} loading={busy} />
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
	options: { gap: spacing.xs },
	optionItem: {
		minHeight: TOUCH_MIN,
		justifyContent: "center",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
	optionText: { fontSize: fontSize.xs, color: colors.text },
	optionTextActive: { color: colors.textInverse, fontWeight: "700" },
	preview: { gap: spacing.sm },
	photo: { width: "100%", height: 220, borderRadius: radius.md, backgroundColor: colors.backgroundAlt },
	photoRow: { flexDirection: "row", gap: spacing.sm },
	photoButton: { flex: 1 },
	removePhoto: {
		minHeight: TOUCH_MIN,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.danger,
	},
	removePhotoText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.danger },
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
	actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	actionButton: { flex: 1 },
	report: {
		marginTop: spacing.sm,
		gap: spacing.xs,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		paddingTop: spacing.sm,
	},
	reportTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	gap: { height: spacing.sm },
});
