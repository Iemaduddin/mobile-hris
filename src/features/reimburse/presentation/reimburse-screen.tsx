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
import { Field, DateField } from "@/features/requests/presentation/form-fields";
import { captureAttachmentPhoto, pickAttachmentImage } from "@/features/requests/data/pick-lampiran";
import { uploadAttachment, type PickedFile } from "@/features/requests/data/requests-api";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { ApiException } from "@/core/network/api-exception";
import { formatIDR } from "@/core/util/format";
import {
	REIMBURSE_CATEGORIES,
	getCategoryLabel,
} from "../data/reimburse-api";
import { getReimbursementStatusLabel, getReimbursementStatusTone } from "../models/reimburse";
import { useCreateReimbursement, useMyReimbursements, useReimbursementAction } from "../providers/reimburse-queries";

/**
 * Reimbursement — M-ESS-1. Receipt photo (camera/gallery) required,
 * amount + description, sent straight for verification.
 */
export function ReimburseScreen() {
	const employeeId = useAuthStore((s) => s.employee?.id);
	const list = useMyReimbursements();
	const create = useCreateReimbursement();
	const action = useReimbursementAction();

	const [category, setCategory] = useState<string>("TRANSPORT");
	const [receiptDate, setReceiptDate] = useState("");
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");
	const [file, setFile] = useState<PickedFile | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const busy = submitting || create.isPending || action.isPending;

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

	async function submit() {
		const value = Number(String(amount).replace(/[^0-9]/g, ""));
		if (!description.trim()) {
			setError("Keterangan wajib diisi.");
			return;
		}
		if (!Number.isFinite(value) || value <= 0) {
			setError("Nominal harus lebih dari 0.");
			return;
		}
		if (!file) {
			setError("Foto struk wajib dilampirkan.");
			return;
		}
		if (!employeeId) {
			setError("Akun belum tertaut ke data karyawan.");
			return;
		}
		setError(null);
		setSubmitting(true);
		try {
			// ownerType=pengajuan + ownerId=<karyawanId>, subfolder=lampiran.
			const uploaded = await uploadAttachment(file, employeeId);
			const draft = await create.mutateAsync({
				category,
				receiptDate: receiptDate || undefined,
				amount: value,
				description: description.trim(),
				attachmentUrl: uploaded.path,
			});
			await action.mutateAsync({ id: draft.id, action: "submit" });
			Alert.alert("Terkirim", "Klaim diteruskan untuk verifikasi.");
			setAmount("");
			setDescription("");
			setReceiptDate("");
			setFile(null);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setSubmitting(false);
		}
	}

	if (list.isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Reimbursement" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (list.isError && list.data === undefined)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Reimbursement" />
				<ErrorView message="Gagal memuat klaim." onRetry={() => void list.refetch()} />
			</View>
		);

	const items = list.data ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader title="Reimbursement" subtitle={items.length > 0 ? `${items.length} klaim` : undefined} />
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
						<Text style={styles.formTitle}>Klaim Baru</Text>
						<Text style={styles.formSubtitle}>Struk difoto langsung — plafon dicek server.</Text>

						<Field label="Kategori">
							<View style={styles.chips}>
								{REIMBURSE_CATEGORIES.map((k) => (
									<Pressable
										key={k}
										onPress={() => setCategory(k)}
										accessibilityRole="button"
										accessibilityState={{ selected: category === k }}
										style={[styles.chip, category === k && styles.chipActive]}
									>
										<Text style={[styles.chipText, category === k && styles.chipTextActive]}>
											{getCategoryLabel(k)}
										</Text>
									</Pressable>
								))}
							</View>
						</Field>

						<DateField label="Tanggal kwitansi" value={receiptDate} onChange={setReceiptDate} />

						<AppTextField
							label="Nominal (Rp)"
							value={amount}
							onChangeText={setAmount}
							keyboardType="numeric"
							placeholder="cth. 150000"
						/>

						<AppTextField
							label="Keterangan"
							value={description}
							onChangeText={setDescription}
							placeholder="cth. Bensin dinas Bandung"
						/>

						<Field label="Foto struk (wajib)">
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

						<AppButton label="Kirim Pengajuan" onPress={() => void submit()} loading={busy} />
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada klaim reimbursement." />}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.number} numberOfLines={1}>
								{item.number}
							</Text>
							<StatusChip label={getReimbursementStatusLabel(item.status)} tone={getReimbursementStatusTone(item.status)} />
						</View>
						<Text style={styles.description} numberOfLines={2}>
							{item.description}
						</Text>
						<Text style={styles.meta}>
							{getCategoryLabel(item.category)} · {formatIDR(item.amount)}
						</Text>
						{item.status === "DRAFT" ? (
							<View style={styles.actionRow}>
								<View style={styles.actionButton}>
									<AppButton
										label="Ajukan"
										onPress={() =>
											action.mutate(
												{ id: item.id, action: "submit" },
												{ onError: (e) => Alert.alert("Gagal", getErrorMessage(e)) },
											)
										}
										loading={action.isPending}
									/>
								</View>
							</View>
						) : null}
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
	chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
	chip: {
		minHeight: 36,
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
	description: { fontSize: fontSize.sm, color: colors.text },
	meta: { fontSize: fontSize.xs, color: colors.textMuted },
	actionRow: { flexDirection: "row", marginTop: spacing.xs },
	actionButton: { flex: 1 },
	gap: { height: spacing.sm },
});
