import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ApiException } from "@/core/network/api-exception";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { Notice, type NoticeProps } from "@/core/widgets/notice";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { captureAttachmentPhoto, pickAttachmentImage } from "../data/pick-lampiran";
import { uploadAttachment, type PickedFile } from "../data/requests-api";
import {
	REQUEST_KINDS,
	getRequestKindLabel,
	type RequestActionResult,
	type RequestKind,
} from "../models/request";
import { useAbsenceTypes, useCreateRequest, useRequestAction } from "../providers/requests-queries";
import { DateField, Field, TimeField } from "./form-fields";

type NoticeState = NoticeProps | null;

type Errors = Record<string, string>;

/**
 * Leave/overtime/duty request form — mobile PRD Bag. 5.4.B.
 * Flow: validate → (optional) upload attachment → save DRAFT → optional submit.
 */
export function RequestFormScreen({ initialKind }: { initialKind: RequestKind }) {
	const absenceTypes = useAbsenceTypes();
	const create = useCreateRequest();
	const action = useRequestAction();
	const employeeId = useAuthStore((s) => s.employee?.id ?? null);

	const [kind, setKind] = useState<RequestKind>(initialKind);
	const [errors, setErrors] = useState<Errors>({});
	const [notice, setNotice] = useState<NoticeState>(null);
	const [busy, setBusy] = useState(false);

	// Leave & duty share the date range.
	const [leaveTypeId, setLeaveTypeId] = useState<number | null>(null);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [reason, setReason] = useState("");
	const [address, setAddress] = useState("");
	const [emergencyPhone, setEmergencyPhone] = useState("");
	const [attachment, setAttachment] = useState<PickedFile | null>(null);

	// Overtime.
	const [date, setDate] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");

	// Duty.
	const [dutyType, setDutyType] = useState("DINAS_LUAR");
	const [location, setLocation] = useState("");
	const [purpose, setPurpose] = useState("");

	const activeLeaveType =
		absenceTypes.data?.find((j) => j.id === leaveTypeId) ?? absenceTypes.data?.[0] ?? null;
	const requiresAttachment = kind === "leave" && activeLeaveType?.requiresAttachment === true;

	function validate(): Errors {
		const e: Errors = {};
		if (kind === "leave") {
			if (!activeLeaveType) e.leaveType = "Daftar jenis ketidakhadiran belum dimuat.";
			if (!startDate) e.startDate = "Tanggal mulai wajib diisi.";
			if (!endDate) e.endDate = "Tanggal selesai wajib diisi.";
			if (startDate && endDate && endDate < startDate) e.endDate = "Tanggal selesai sebelum tanggal mulai.";
			if (requiresAttachment && !attachment) e.attachment = "Jenis ini mewajibkan lampiran.";
		} else if (kind === "overtime") {
			if (!date) e.date = "Tanggal wajib diisi.";
			if (!startTime) e.startTime = "Jam mulai wajib diisi.";
			if (!endTime) e.endTime = "Jam selesai wajib diisi.";
			if (startTime && endTime && endTime <= startTime)
				e.endTime = "Jam selesai harus setelah jam mulai.";
			if (!reason.trim()) e.reason = "Alasan wajib diisi.";
		} else {
			if (!startDate) e.startDate = "Tanggal mulai wajib diisi.";
			if (!endDate) e.endDate = "Tanggal selesai wajib diisi.";
			if (startDate && endDate && endDate < startDate) e.endDate = "Tanggal selesai sebelum tanggal mulai.";
		}
		return e;
	}

	async function pickFile(source: "camera" | "gallery") {
		const result = source === "camera" ? await captureAttachmentPhoto() : await pickAttachmentImage();
		if (result.status === "picked") {
			setAttachment(result.file);
			setErrors((prev) => ({ ...prev, attachment: "" }));
		} else if (result.status === "permission_denied") {
			setNotice({
				tone: "warning",
				title: source === "camera" ? "Izin kamera ditolak" : "Izin galeri ditolak",
				description: "Aktifkan izin di pengaturan perangkat untuk mengambil lampiran.",
			});
		} else if (result.status === "too_large") {
			setNotice({ tone: "danger", title: "Berkas terlalu besar", description: "Maksimal 10MB." });
		}
	}

	async function save(withSubmit: boolean) {
		const e = validate();
		setErrors(e);
		if (Object.keys(e).length > 0) return;

		setNotice(null);
		setBusy(true);
		try {
			let attachmentPath: string | undefined;
			if (attachment) {
				// Upload first since the request does not exist yet — PRD Bag. 5.4 uses
				// ownerType=pengajuan + ownerId=<karyawanId>, subfolder=lampiran.
				const uploaded = await uploadAttachment(
					attachment,
					employeeId ?? `draft-${Date.now().toString(36)}`,
				);
				attachmentPath = uploaded.path;
			}

			let result: RequestActionResult;

			if (kind === "leave") {
				if (!activeLeaveType) {
					setNotice({
						tone: "danger",
						title: "Gagal menyimpan",
						description: "Daftar jenis ketidakhadiran belum dimuat.",
					});
					return;
				}
				result = await create.mutateAsync({
					kind,
					input: {
						leaveTypeId: activeLeaveType.id,
						startDate,
						endDate,
						reason: reason.trim() || undefined,
						address: address.trim() || undefined,
						emergencyPhone: emergencyPhone.trim() || undefined,
						attachment: attachmentPath,
					},
				});
			} else if (kind === "overtime") {
				result = await create.mutateAsync({
					kind,
					input: { date, startTime, endTime, reason: reason.trim() },
				});
			} else {
				result = await create.mutateAsync({
					kind,
					input: {
						dutyType,
						startDate,
						endDate,
						location: location.trim() || undefined,
						purpose: purpose.trim() || undefined,
						attachment: attachmentPath,
					},
				});
			}

			if (!result.success) {
				setNotice({ tone: "danger", title: "Gagal menyimpan", description: result.message });
				return;
			}

			if (withSubmit && result.id) {
				await action.mutateAsync({ kind, id: result.id, action: "submit" });
			}

			router.back();
		} catch (error) {
			setNotice({
				tone: "danger",
				title: withSubmit ? "Gagal mengirim pengajuan" : "Gagal menyimpan draf",
				description: error instanceof ApiException ? error.message : "Terjadi kesalahan.",
			});
		} finally {
			setBusy(false);
		}
	}

	return (
		<>
			<ScreenHeader title="Buat Pengajuan" subtitle={getRequestKindLabel(kind)} />
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					{notice ? <Notice {...notice} /> : null}

					<View style={styles.segmented}>
						{REQUEST_KINDS.map((k) => (
							<Pressable
								key={k}
								onPress={() => setKind(k)}
								accessibilityRole="tab"
								accessibilityState={{ selected: kind === k }}
								style={[styles.seg, kind === k ? styles.segActive : null]}
							>
								<Text style={[styles.segText, kind === k ? styles.segTextActive : null]}>
									{getRequestKindLabel(k)}
								</Text>
							</Pressable>
						))}
					</View>

					{kind === "leave" ? (
						<View>
							<Field label="Jenis ketidakhadiran" error={errors.leaveType}>
								<View style={styles.chips}>
									{(absenceTypes.data ?? []).map((j) => (
										<Pressable
											key={j.id}
											onPress={() => setLeaveTypeId(j.id)}
											accessibilityRole="button"
											style={[styles.chip, activeLeaveType?.id === j.id ? styles.chipActive : null]}
										>
											<Text
												style={[
													styles.chipText,
													activeLeaveType?.id === j.id ? styles.chipTextActive : null,
												]}
											>
												{j.name}
											</Text>
										</Pressable>
									))}
								</View>
							</Field>

							<DateField label="Tanggal mulai" value={startDate} onChange={setStartDate} error={errors.startDate} />
							<DateField
								label="Tanggal selesai"
								value={endDate}
								onChange={setEndDate}
								error={errors.endDate}
							/>
							<AppTextField
								label="Alasan (opsional)"
								value={reason}
								onChangeText={setReason}
								multiline
								numberOfLines={3}
								style={styles.multiline}
							/>
							<AppTextField
								label="Alamat selama tidak hadir (opsional)"
								value={address}
								onChangeText={setAddress}
							/>
							<AppTextField
								label="Telepon darurat (opsional)"
								value={emergencyPhone}
								onChangeText={setEmergencyPhone}
								keyboardType="phone-pad"
							/>
							<AttachmentField
								file={attachment}
								required={requiresAttachment}
								error={errors.attachment}
								onCamera={() => void pickFile("camera")}
								onGallery={() => void pickFile("gallery")}
								onRemove={() => setAttachment(null)}
							/>
						</View>
					) : null}

					{kind === "overtime" ? (
						<View>
							<DateField label="Tanggal" value={date} onChange={setDate} error={errors.date} />
							<View style={styles.row}>
								<View style={styles.rowItem}>
									<TimeField label="Jam mulai" value={startTime} onChange={setStartTime} error={errors.startTime} />
								</View>
								<View style={styles.rowItem}>
									<TimeField
										label="Jam selesai"
										value={endTime}
										onChange={setEndTime}
										error={errors.endTime}
									/>
								</View>
							</View>
							<AppTextField
								label="Alasan"
								value={reason}
								onChangeText={setReason}
								error={errors.reason}
								multiline
								numberOfLines={3}
								style={styles.multiline}
							/>
						</View>
					) : null}

					{kind === "duty" ? (
						<View>
							<Field label="Jenis dinas">
								<View style={styles.chips}>
									{[
										{ value: "DINAS_LUAR", label: "Dinas Luar" },
										{ value: "WFH", label: "WFH" },
									].map((o) => (
										<Pressable
											key={o.value}
											onPress={() => setDutyType(o.value)}
											accessibilityRole="button"
											style={[styles.chip, dutyType === o.value ? styles.chipActive : null]}
										>
											<Text
												style={[
													styles.chipText,
													dutyType === o.value ? styles.chipTextActive : null,
												]}
											>
												{o.label}
											</Text>
										</Pressable>
									))}
								</View>
							</Field>
							<DateField label="Tanggal mulai" value={startDate} onChange={setStartDate} error={errors.startDate} />
							<DateField
								label="Tanggal selesai"
								value={endDate}
								onChange={setEndDate}
								error={errors.endDate}
							/>
							<AppTextField
								label="Lokasi (opsional)"
								value={location}
								onChangeText={setLocation}
								placeholder="Contoh: Kantor Cabang Surabaya"
							/>
							<AppTextField
								label="Keperluan (opsional)"
								value={purpose}
								onChangeText={setPurpose}
								multiline
								numberOfLines={3}
								style={styles.multiline}
							/>
							<AttachmentField
								file={attachment}
								required={false}
								error={errors.attachment}
								onCamera={() => void pickFile("camera")}
								onGallery={() => void pickFile("gallery")}
								onRemove={() => setAttachment(null)}
							/>
						</View>
					) : null}

					<View style={styles.actions}>
						<AppButton
							label="Simpan Draf"
							variant="outline"
							loading={busy}
							onPress={() => void save(false)}
							style={styles.action}
						/>
						<AppButton label="Ajukan" loading={busy} onPress={() => void save(true)} style={styles.action} />
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}

function AttachmentField({
	file,
	required,
	error,
	onCamera,
	onGallery,
	onRemove,
}: {
	file: PickedFile | null;
	required: boolean;
	error?: string;
	onCamera: () => void;
	onGallery: () => void;
	onRemove: () => void;
}) {
	return (
		<Field label={`Lampiran${required ? " *" : " (opsional)"}`} error={error}>
			{file ? (
				<View style={styles.attachmentRow}>
					<Text style={styles.attachmentName} numberOfLines={1}>
						{file.name}
					</Text>
					<Pressable onPress={onRemove} accessibilityRole="button" hitSlop={8} style={styles.linkButton}>
						<Text style={styles.linkText}>Hapus</Text>
					</Pressable>
				</View>
			) : (
				<View style={styles.attachmentPick}>
					<AppButton label="Ambil Foto" variant="outline" onPress={onCamera} style={styles.half} />
					<AppButton label="Galeri" variant="outline" onPress={onGallery} style={styles.half} />
				</View>
			)}
		</Field>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },

	segmented: {
		flexDirection: "row",
		backgroundColor: colors.backgroundAlt,
		borderRadius: radius.full,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 3,
		gap: 3,
	},
	seg: {
		flex: 1,
		minHeight: 38,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
	},
	segActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
	segText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
	segTextActive: { color: colors.primary },

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
	chipText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
	chipTextActive: { color: colors.textInverse },

	row: { flexDirection: "row", gap: spacing.md },
	rowItem: { flex: 1 },
	multiline: { minHeight: 88, paddingTop: spacing.sm, textAlignVertical: "top" },

	attachmentRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		minHeight: 44,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		backgroundColor: colors.backgroundAlt,
	},
	attachmentName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
	attachmentPick: { flexDirection: "row", gap: spacing.sm },
	half: { flex: 1 },
	linkButton: { paddingVertical: spacing.xs },
	linkText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.danger },

	actions: { gap: spacing.sm, marginTop: spacing.md },
	action: { width: "100%" },
});
