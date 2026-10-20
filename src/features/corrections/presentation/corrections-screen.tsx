import { useState } from "react";
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { Notice, type NoticeProps } from "@/core/widgets/notice";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { DateField, Field, TimeField } from "@/features/requests/presentation/form-fields";
import { captureAttachmentPhoto, pickAttachmentImage } from "@/features/requests/data/pick-lampiran";
import { uploadAttachment, type PickedFile } from "@/features/requests/data/requests-api";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { ApiException } from "@/core/network/api-exception";
import { formatDate } from "@/core/util/format";
import { CORRECTION_TYPES, getCorrectionTypeLabel } from "../data/corrections-api";
import { getCorrectionStatusLabel, getCorrectionStatusTone } from "../models/corrections";
import { useCorrectionAction, useCreateCorrection, useMyCorrections } from "../providers/corrections-queries";

/**
 * Attendance Correction — M-ESS-3. Proposed correct time + optional proof,
 * processed by lead → HR (replaces direct edits closed in P0-9).
 */
export function CorrectionsScreen() {
	const employeeId = useAuthStore((s) => s.employee?.id);
	const list = useMyCorrections();
	const create = useCreateCorrection();
	const action = useCorrectionAction();

	const [date, setDate] = useState("");
	const [eventType, setEventType] = useState<string>("MASUK");
	const [time, setTime] = useState("");
	const [reason, setReason] = useState("");
	const [file, setFile] = useState<PickedFile | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<NoticeProps | null>(null);

	const busy = submitting || create.isPending || action.isPending;

	function getErrorMessage(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	async function pickEvidence(source: "camera" | "gallery") {
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
		if (!date) {
			setError("Tanggal wajib diisi.");
			return;
		}
		if (!time) {
			setError("Jam seharusnya wajib diisi.");
			return;
		}
		if (!reason.trim()) {
			setError("Alasan wajib diisi.");
			return;
		}
		if (!employeeId) {
			setError("Akun belum tertaut ke data karyawan.");
			return;
		}
		setError(null);
		setSubmitting(true);
		try {
			let attachmentUrl = "";
			if (file) {
				const uploaded = await uploadAttachment(file, employeeId);
				attachmentUrl = uploaded.path;
			}
			const draft = await create.mutateAsync({
				date,
				eventType,
				time,
				reason: reason.trim(),
				attachmentUrl,
			});
			await action.mutateAsync({ id: draft.id, action: "submit" });
			setNotice({ tone: "success", title: "Usulan terkirim", description: "Correction diteruskan ke atasan → HR." });
			setDate("");
			setTime("");
			setReason("");
			setFile(null);
		} catch (err) {
			setNotice({ tone: "danger", title: "Gagal mengirim usulan", description: getErrorMessage(err) });
			setError(getErrorMessage(err));
		} finally {
			setSubmitting(false);
		}
	}

	if (list.isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Koreksi Presensi" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (list.isError && list.data === undefined)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Koreksi Presensi" />
				<ErrorView message="Gagal memuat koreksi." onRetry={() => void list.refetch()} />
			</View>
		);

	const items = list.data ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader title="Koreksi Presensi" subtitle={items.length > 0 ? `${items.length} usulan` : undefined} />
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
						{notice ? <Notice {...notice} /> : null}
						<Text style={styles.formTitle}>Usulan Baru</Text>
						<Text style={styles.formSubtitle}>Lupa clock-in? Usulkan jam yang benar.</Text>

						<DateField label="Tanggal" value={date} onChange={setDate} />

						<Field label="Tipe">
							<View style={styles.chips}>
								{CORRECTION_TYPES.map((t) => (
									<Pressable
										key={t}
										onPress={() => setEventType(t)}
										accessibilityRole="button"
										accessibilityState={{ selected: eventType === t }}
										style={[styles.chip, eventType === t && styles.chipActive]}
									>
										<Text style={[styles.chipText, eventType === t && styles.chipTextActive]}>
											{getCorrectionTypeLabel(t)}
										</Text>
									</Pressable>
								))}
							</View>
						</Field>

						<TimeField label="Jam seharusnya" value={time} onChange={setTime} />

						<AppTextField
							label="Alasan"
							value={reason}
							onChangeText={setReason}
							placeholder="cth. Lupa clock-in, mesin antre"
						/>

						<Field label="Bukti (opsional)">
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
										<AppButton label="📷 Kamera" variant="outline" onPress={() => void pickEvidence("camera")} />
									</View>
									<View style={styles.photoButton}>
										<AppButton label="🖼 Galeri" variant="outline" onPress={() => void pickEvidence("gallery")} />
									</View>
								</View>
							)}
						</Field>

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<AppButton label="Kirim Usulan" onPress={() => void submit()} loading={busy} />
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada usulan koreksi." />}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.title} numberOfLines={1}>
								{getCorrectionTypeLabel(item.eventType)} · {formatDate(item.date)}
							</Text>
							<StatusChip label={getCorrectionStatusLabel(item.status)} tone={getCorrectionStatusTone(item.status)} />
						</View>
						<Text style={styles.meta}>
							→ {item.correctedTime.slice(11, 16)} · {item.reason}
						</Text>
						{item.status === "DRAFT" ? (
							<View style={styles.actionRow}>
								<View style={styles.actionButton}>
									<AppButton
										label="Ajukan"
										onPress={() =>
											action.mutate(
												{ id: item.id, action: "submit" },
												{
													onSuccess: () => setNotice({ tone: "success", title: "Usulan diajukan", description: "Correction berhasil diajukan." }),
													onError: (e) => setNotice({ tone: "danger", title: "Gagal mengajukan", description: getErrorMessage(e) }),
												},
											)
										}
										loading={action.isPending}
									/>
								</View>
								<View style={styles.actionButton}>
									<AppButton
										label="Batal"
										variant="outline"
										onPress={() =>
											action.mutate(
												{ id: item.id, action: "cancel" },
												{
													onSuccess: () => setNotice({ tone: "success", title: "Usulan dibatalkan", description: "Correction berhasil dibatalkan." }),
													onError: (e) => setNotice({ tone: "danger", title: "Gagal membatalkan", description: getErrorMessage(e) }),
												},
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
	photo: { width: "100%", height: 200, borderRadius: radius.md, backgroundColor: colors.backgroundAlt },
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
	title: { flex: 1, fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	meta: { fontSize: fontSize.xs, color: colors.textMuted },
	actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	actionButton: { flex: 1 },
	gap: { height: spacing.sm },
});
