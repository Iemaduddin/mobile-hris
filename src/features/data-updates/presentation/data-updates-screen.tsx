import { useState } from "react";
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { DateField, Field } from "@/features/requests/presentation/form-fields";
import { captureAttachmentPhoto, pickAttachmentImage } from "@/features/requests/data/pick-lampiran";
import { uploadAttachment, type PickedFile } from "@/features/requests/data/requests-api";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { ApiException } from "@/core/network/api-exception";
import {
	DEGREES,
	DOCUMENT_TYPES,
	GENDERS,
	RELATIONSHIPS,
	UPDATE_CATEGORIES,
	getUpdateCategoryLabel,
} from "../data/data-updates-api";
import { getDataUpdateStatusLabel, getDataUpdateStatusTone } from "../models/data-updates";
import {
	useCreateDataUpdate,
	useDataUpdateAction,
	useMyDataUpdates,
	useMyFamily,
} from "../providers/data-updates-queries";

function formatEnumLabel(v: string): string {
	return v.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Data Update — M-ESS-5. Address/contact/family/education/document proposals,
 * HR-verified before applying. Sensitive data (NIK/bank) stays HR-only.
 */
export function DataUpdatesScreen() {
	const employeeId = useAuthStore((s) => s.employee?.id);
	const list = useMyDataUpdates();
	const family = useMyFamily();
	const create = useCreateDataUpdate();
	const action = useDataUpdateAction();

	const [category, setCategory] = useState<string>("ALAMAT");
	const [form, setForm] = useState<Record<string, string>>({});
	const [reason, setReason] = useState("");
	const [file, setFile] = useState<PickedFile | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const busy = submitting || create.isPending || action.isPending;

	function setField(k: string, v: string) {
		setForm((prev) => ({ ...prev, [k]: v }));
	}

	function switchCategory(k: string) {
		setCategory(k);
		setForm({});
		setFile(null);
		setError(null);
	}

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
		if (!reason.trim()) {
			setError("Alasan perubahan wajib diisi.");
			return;
		}
		if (!employeeId) {
			setError("Akun belum tertaut ke data karyawan.");
			return;
		}
		const newData: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(form)) {
			if (v !== "") newData[k] = v;
		}
		if (category === "KELUARGA" && form.targetId === "new") delete newData.targetId;
		if (category === "DOKUMEN" && file) {
			try {
				const uploaded = await uploadAttachment(file, employeeId);
				newData.fileUrl = uploaded.path;
			} catch (err) {
				setError(`Gagal mengunggah dokumen: ${getErrorMessage(err)}`);
				return;
			}
		}
		setError(null);
		setSubmitting(true);
		try {
			const draft = await create.mutateAsync({
				category,
				targetId:
					category === "KELUARGA" && form.targetId && form.targetId !== "new" ? form.targetId : undefined,
				newData,
				reason: reason.trim(),
			});
			await action.mutateAsync({ id: draft.id, action: "submit" });
			Alert.alert("Terkirim", "Usulan diteruskan ke HR untuk verifikasi.");
			setForm({});
			setReason("");
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
				<ScreenHeader title="Update Data" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (list.isError && list.data === undefined)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Update Data" />
				<ErrorView message="Gagal memuat usulan." onRetry={() => void list.refetch()} />
			</View>
		);

	const items = list.data ?? [];
	const members = family.data ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader title="Update Data" subtitle={items.length > 0 ? `${items.length} usulan` : undefined} />
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
							<Text style={styles.formSubtitle}>Diverifikasi HR sebelum diterapkan.</Text>

							<Field label="Kategori">
								<View style={styles.chips}>
									{UPDATE_CATEGORIES.map((k) => (
										<Pressable
											key={k}
											onPress={() => switchCategory(k)}
											accessibilityRole="button"
											accessibilityState={{ selected: category === k }}
											style={[styles.chip, category === k && styles.chipActive]}
										>
											<Text style={[styles.chipText, category === k && styles.chipTextActive]}>
												{getUpdateCategoryLabel(k)}
											</Text>
										</Pressable>
									))}
								</View>
							</Field>

							{category === "ALAMAT" && (
								<AppTextField
									label="Alamat baru"
									value={form.address ?? ""}
									onChangeText={(v) => setField("address", v)}
									placeholder="cth. Jl. Baru No. 10"
								/>
							)}

							{category === "KONTAK" && (
								<>
									<AppTextField
										label="Telepon baru"
										value={form.phone ?? ""}
										onChangeText={(v) => setField("phone", v)}
										keyboardType="phone-pad"
										placeholder="cth. 081234567890"
									/>
									<AppTextField
										label="Email baru"
										value={form.email ?? ""}
										onChangeText={(v) => setField("email", v)}
										keyboardType="email-address"
										autoCapitalize="none"
										placeholder="cth. nama@baru.id"
									/>
								</>
							)}

							{category === "KELUARGA" && (
								<>
									<Field label="Target">
										<View style={styles.chips}>
											<Pressable
												onPress={() => setField("targetId", "new")}
												accessibilityRole="button"
												style={[styles.chip, (form.targetId ?? "new") === "new" && styles.chipActive]}
											>
												<Text
													style={[styles.chipText, (form.targetId ?? "new") === "new" && styles.chipTextActive]}
												>
													Anggota baru
												</Text>
											</Pressable>
											{members.map((a) => (
												<Pressable
													key={a.id}
													onPress={() => setField("targetId", a.id)}
													accessibilityRole="button"
													style={[styles.chip, form.targetId === a.id && styles.chipActive]}
												>
													<Text style={[styles.chipText, form.targetId === a.id && styles.chipTextActive]}>
														{a.name}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<AppTextField label="Nama" value={form.name ?? ""} onChangeText={(v) => setField("name", v)} />
									<Field label="Hubungan">
										<View style={styles.chips}>
											{RELATIONSHIPS.map((h) => (
												<Pressable
													key={h}
													onPress={() => setField("relation", h)}
													accessibilityRole="button"
													style={[styles.chip, form.relation === h && styles.chipActive]}
												>
													<Text style={[styles.chipText, form.relation === h && styles.chipTextActive]}>
														{formatEnumLabel(h)}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<Field label="Jenis kelamin">
										<View style={styles.chips}>
											{GENDERS.map((g) => (
												<Pressable
													key={g}
													onPress={() => setField("gender", g)}
													accessibilityRole="button"
													style={[styles.chip, form.gender === g && styles.chipActive]}
												>
													<Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>
														{formatEnumLabel(g)}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<DateField
										label="Tanggal lahir"
										value={form.birthDate ?? ""}
										onChange={(v) => setField("birthDate", v)}
									/>
									<AppTextField label="NIK (opsional)" value={form.nik ?? ""} onChangeText={(v) => setField("nik", v)} keyboardType="numeric" />
									<AppTextField label="Pekerjaan (opsional)" value={form.occupation ?? ""} onChangeText={(v) => setField("occupation", v)} />
								</>
							)}

							{category === "PENDIDIKAN" && (
								<>
									<Field label="Gelar">
										<View style={styles.chips}>
											{DEGREES.map((g) => (
												<Pressable
													key={g}
													onPress={() => setField("degree", g)}
													accessibilityRole="button"
													style={[styles.chip, form.degree === g && styles.chipActive]}
												>
													<Text style={[styles.chipText, form.degree === g && styles.chipTextActive]}>
														{g.replace("_", "/")}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<AppTextField label="Institusi" value={form.institution ?? ""} onChangeText={(v) => setField("institution", v)} />
									<AppTextField label="Jurusan (opsional)" value={form.major ?? ""} onChangeText={(v) => setField("major", v)} />
									<AppTextField label="Tahun mulai (opsional)" value={form.startYear ?? ""} onChangeText={(v) => setField("startYear", v)} keyboardType="numeric" />
									<AppTextField label="Tahun lulus (opsional)" value={form.graduationYear ?? ""} onChangeText={(v) => setField("graduationYear", v)} keyboardType="numeric" />
									<AppTextField label="IPK (opsional)" value={form.gpa ?? ""} onChangeText={(v) => setField("gpa", v)} keyboardType="decimal-pad" />
								</>
							)}

							{category === "DOKUMEN" && (
								<>
									<Field label="Jenis dokumen">
										<View style={styles.chips}>
											{DOCUMENT_TYPES.map((j) => (
												<Pressable
													key={j}
													onPress={() => setField("documentType", j)}
													accessibilityRole="button"
													style={[styles.chip, form.documentType === j && styles.chipActive]}
												>
													<Text style={[styles.chipText, form.documentType === j && styles.chipTextActive]}>
														{formatEnumLabel(j)}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<AppTextField label="Nama dokumen" value={form.name ?? ""} onChangeText={(v) => setField("name", v)} />
									<Field label="File (foto)">
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
									<DateField
										label="Kadaluarsa (opsional)"
										value={form.expiryDate ?? ""}
										onChange={(v) => setField("expiryDate", v)}
									/>
									<AppTextField label="Catatan (opsional)" value={form.note ?? ""} onChangeText={(v) => setField("note", v)} />
								</>
							)}

							<AppTextField
								label="Alasan perubahan"
								value={reason}
								onChangeText={setReason}
								placeholder="cth. Pindah rumah"
							/>

							{error ? <Text style={styles.error}>{error}</Text> : null}

							<AppButton label="Kirim Usulan" onPress={() => void submit()} loading={busy} />
						</View>

						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Usulan saya ({items.length})</Text>
							{items.length === 0 ? (
								<Text style={styles.meta}>Belum ada usulan.</Text>
							) : (
								items.map((item) => (
									<View key={item.id} style={styles.card}>
										<View style={styles.cardHead}>
											<Text style={styles.title} numberOfLines={1}>
												{item.number}
											</Text>
											<StatusChip label={getDataUpdateStatusLabel(item.status)} tone={getDataUpdateStatusTone(item.status)} />
										</View>
										<Text style={styles.meta} numberOfLines={2}>
											{item.summary}
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
												<View style={styles.actionButton}>
													<AppButton
														label="Batal"
														variant="outline"
														onPress={() =>
															action.mutate(
																{ id: item.id, action: "cancel" },
																{ onError: (e) => Alert.alert("Gagal", getErrorMessage(e)) },
															)
														}
														loading={action.isPending}
													/>
												</View>
											</View>
										) : null}
									</View>
								))
							)}
						</View>
					</View>
				)}
			/>
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
	gap: { height: spacing.sm },
});
