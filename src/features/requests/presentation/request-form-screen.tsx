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
import { ambilFotoLampiran, pilihLampiran } from "../data/pick-lampiran";
import { unggahLampiran, type BerkasPilihan } from "../data/requests-api";
import {
	daftarJenisPengajuan,
	labelJenisPengajuan,
	type HasilAksiPengajuan,
	type JenisPengajuan,
} from "../models/request";
import { useAksiPengajuan, useBuatPengajuan, useJenisList } from "../providers/requests-queries";
import { DateField, Field, TimeField } from "./form-fields";

type Pesan = NoticeProps | null;

type Errors = Record<string, string>;

/**
 * Form buat pengajuan cuti/lembur/dinas — PRD mobile Bag. 5.4.B.
 * Alur: validasi → (opsional) unggah lampiran → simpan DRAFT → opsional ajukan.
 */
export function RequestFormScreen({ jenisAwal }: { jenisAwal: JenisPengajuan }) {
	const jenisList = useJenisList();
	const buat = useBuatPengajuan();
	const aksi = useAksiPengajuan();
	const karyawanId = useAuthStore((s) => s.karyawan?.id ?? null);

	const [jenis, setJenis] = useState<JenisPengajuan>(jenisAwal);
	const [errors, setErrors] = useState<Errors>({});
	const [pesan, setPesan] = useState<Pesan>(null);
	const [busy, setBusy] = useState(false);

	// Cuti & Dinas berbagi rentang tanggal.
	const [cutiJenisId, setCutiJenisId] = useState<number | null>(null);
	const [mulai, setMulai] = useState("");
	const [selesai, setSelesai] = useState("");
	const [alasan, setAlasan] = useState("");
	const [alamat, setAlamat] = useState("");
	const [telp, setTelp] = useState("");
	const [lampiran, setLampiran] = useState<BerkasPilihan | null>(null);

	// Lembur.
	const [tanggal, setTanggal] = useState("");
	const [jamMulai, setJamMulai] = useState("");
	const [jamSelesai, setJamSelesai] = useState("");

	// Dinas.
	const [dinasJenis, setDinasJenis] = useState("DINAS_LUAR");
	const [lokasi, setLokasi] = useState("");
	const [keperluan, setKeperluan] = useState("");

	const jenisAktif =
		jenisList.data?.find((j) => j.id === cutiJenisId) ?? jenisList.data?.[0] ?? null;
	const wajibLampiran = jenis === "cuti" && jenisAktif?.wajibLampiran === true;

	function validasi(): Errors {
		const e: Errors = {};
		if (jenis === "cuti") {
			if (!jenisAktif) e.jenis = "Daftar jenis ketidakhadiran belum dimuat.";
			if (!mulai) e.mulai = "Tanggal mulai wajib diisi.";
			if (!selesai) e.selesai = "Tanggal selesai wajib diisi.";
			if (mulai && selesai && selesai < mulai) e.selesai = "Tanggal selesai sebelum tanggal mulai.";
			if (wajibLampiran && !lampiran) e.lampiran = "Jenis ini mewajibkan lampiran.";
		} else if (jenis === "lembur") {
			if (!tanggal) e.tanggal = "Tanggal wajib diisi.";
			if (!jamMulai) e.jamMulai = "Jam mulai wajib diisi.";
			if (!jamSelesai) e.jamSelesai = "Jam selesai wajib diisi.";
			if (jamMulai && jamSelesai && jamSelesai <= jamMulai)
				e.jamSelesai = "Jam selesai harus setelah jam mulai.";
			if (!alasan.trim()) e.alasan = "Alasan wajib diisi.";
		} else {
			if (!mulai) e.mulai = "Tanggal mulai wajib diisi.";
			if (!selesai) e.selesai = "Tanggal selesai wajib diisi.";
			if (mulai && selesai && selesai < mulai) e.selesai = "Tanggal selesai sebelum tanggal mulai.";
		}
		return e;
	}

	async function pilihBerkas(sumber: "kamera" | "galeri") {
		const hasil = sumber === "kamera" ? await ambilFotoLampiran() : await pilihLampiran();
		if (hasil.status === "dipilih") {
			setLampiran(hasil.berkas);
			setErrors((prev) => ({ ...prev, lampiran: "" }));
		} else if (hasil.status === "izin_ditolak") {
			setPesan({
				tone: "warning",
				title: sumber === "kamera" ? "Izin kamera ditolak" : "Izin galeri ditolak",
				description: "Aktifkan izin di pengaturan perangkat untuk mengambil lampiran.",
			});
		} else if (hasil.status === "kebesaran") {
			setPesan({ tone: "danger", title: "Berkas terlalu besar", description: "Maksimal 10MB." });
		}
	}

	async function simpan(denganAjukan: boolean) {
		const e = validasi();
		setErrors(e);
		if (Object.keys(e).length > 0) return;

		setPesan(null);
		setBusy(true);
		try {
			let lampiranPath: string | undefined;
			if (lampiran) {
				// Unggah didahulukan karena pengajuan belum ada — PRD Bag. 5.4 memakai
				// ownerType=pengajuan + ownerId=<karyawanId>, subfolder=lampiran.
				const hasil = await unggahLampiran(
					lampiran,
					karyawanId ?? `draft-${Date.now().toString(36)}`,
				);
				lampiranPath = hasil.path;
			}

			let hasil: HasilAksiPengajuan;

			if (jenis === "cuti") {
				if (!jenisAktif) {
					setPesan({
						tone: "danger",
						title: "Gagal menyimpan",
						description: "Daftar jenis ketidakhadiran belum dimuat.",
					});
					return;
				}
				hasil = await buat.mutateAsync({
					jenis,
					input: {
						jenisId: jenisAktif.id,
						mulai,
						selesai,
						alasan: alasan.trim() || undefined,
						alamat: alamat.trim() || undefined,
						telpDarurat: telp.trim() || undefined,
						lampiran: lampiranPath,
					},
				});
			} else if (jenis === "lembur") {
				hasil = await buat.mutateAsync({
					jenis,
					input: { tanggal, jamMulai, jamSelesai, alasan: alasan.trim() },
				});
			} else {
				hasil = await buat.mutateAsync({
					jenis,
					input: {
						jenis: dinasJenis,
						mulai,
						selesai,
						lokasi: lokasi.trim() || undefined,
						keperluan: keperluan.trim() || undefined,
						lampiran: lampiranPath,
					},
				});
			}

			if (!hasil.success) {
				setPesan({ tone: "danger", title: "Gagal menyimpan", description: hasil.message });
				return;
			}

			if (denganAjukan && hasil.id) {
				await aksi.mutateAsync({ jenis, id: hasil.id, aksi: "ajukan" });
			}

			router.back();
		} catch (error) {
			setPesan({
				tone: "danger",
				title: denganAjukan ? "Gagal mengirim pengajuan" : "Gagal menyimpan draf",
				description: error instanceof ApiException ? error.message : "Terjadi kesalahan.",
			});
		} finally {
			setBusy(false);
		}
	}

	return (
		<>
			<ScreenHeader title="Buat Pengajuan" subtitle={labelJenisPengajuan(jenis)} />
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					{pesan ? <Notice {...pesan} /> : null}

					<View style={styles.segmented}>
						{daftarJenisPengajuan.map((j) => (
							<Pressable
								key={j}
								onPress={() => setJenis(j)}
								accessibilityRole="tab"
								accessibilityState={{ selected: jenis === j }}
								style={[styles.seg, jenis === j ? styles.segActive : null]}
							>
								<Text style={[styles.segText, jenis === j ? styles.segTextActive : null]}>
									{labelJenisPengajuan(j)}
								</Text>
							</Pressable>
						))}
					</View>

					{jenis === "cuti" ? (
						<View>
							<Field label="Jenis ketidakhadiran" error={errors.jenis}>
								<View style={styles.chips}>
									{(jenisList.data ?? []).map((j) => (
										<Pressable
											key={j.id}
											onPress={() => setCutiJenisId(j.id)}
											accessibilityRole="button"
											style={[styles.chip, jenisAktif?.id === j.id ? styles.chipActive : null]}
										>
											<Text
												style={[
													styles.chipText,
													jenisAktif?.id === j.id ? styles.chipTextActive : null,
												]}
											>
												{j.nama}
											</Text>
										</Pressable>
									))}
								</View>
							</Field>

							<DateField label="Tanggal mulai" value={mulai} onChange={setMulai} error={errors.mulai} />
							<DateField
								label="Tanggal selesai"
								value={selesai}
								onChange={setSelesai}
								error={errors.selesai}
							/>
							<AppTextField
								label="Alasan (opsional)"
								value={alasan}
								onChangeText={setAlasan}
								multiline
								numberOfLines={3}
								style={styles.multiline}
							/>
							<AppTextField
								label="Alamat selama tidak hadir (opsional)"
								value={alamat}
								onChangeText={setAlamat}
							/>
							<AppTextField
								label="Telepon darurat (opsional)"
								value={telp}
								onChangeText={setTelp}
								keyboardType="phone-pad"
							/>
							<LampiranField
								berkas={lampiran}
								wajib={wajibLampiran}
								error={errors.lampiran}
								onKamera={() => void pilihBerkas("kamera")}
								onGaleri={() => void pilihBerkas("galeri")}
								onHapus={() => setLampiran(null)}
							/>
						</View>
					) : null}

					{jenis === "lembur" ? (
						<View>
							<DateField label="Tanggal" value={tanggal} onChange={setTanggal} error={errors.tanggal} />
							<View style={styles.row}>
								<View style={styles.rowItem}>
									<TimeField label="Jam mulai" value={jamMulai} onChange={setJamMulai} error={errors.jamMulai} />
								</View>
								<View style={styles.rowItem}>
									<TimeField
										label="Jam selesai"
										value={jamSelesai}
										onChange={setJamSelesai}
										error={errors.jamSelesai}
									/>
								</View>
							</View>
							<AppTextField
								label="Alasan"
								value={alasan}
								onChangeText={setAlasan}
								error={errors.alasan}
								multiline
								numberOfLines={3}
								style={styles.multiline}
							/>
						</View>
					) : null}

					{jenis === "dinas" ? (
						<View>
							<Field label="Jenis dinas">
								<View style={styles.chips}>
									{[
										{ value: "DINAS_LUAR", label: "Dinas Luar" },
										{ value: "WFH", label: "WFH" },
									].map((o) => (
										<Pressable
											key={o.value}
											onPress={() => setDinasJenis(o.value)}
											accessibilityRole="button"
											style={[styles.chip, dinasJenis === o.value ? styles.chipActive : null]}
										>
											<Text
												style={[
													styles.chipText,
													dinasJenis === o.value ? styles.chipTextActive : null,
												]}
											>
												{o.label}
											</Text>
										</Pressable>
									))}
								</View>
							</Field>
							<DateField label="Tanggal mulai" value={mulai} onChange={setMulai} error={errors.mulai} />
							<DateField
								label="Tanggal selesai"
								value={selesai}
								onChange={setSelesai}
								error={errors.selesai}
							/>
							<AppTextField
								label="Lokasi (opsional)"
								value={lokasi}
								onChangeText={setLokasi}
								placeholder="Contoh: Kantor Cabang Surabaya"
							/>
							<AppTextField
								label="Keperluan (opsional)"
								value={keperluan}
								onChangeText={setKeperluan}
								multiline
								numberOfLines={3}
								style={styles.multiline}
							/>
							<LampiranField
								berkas={lampiran}
								wajib={false}
								error={errors.lampiran}
								onKamera={() => void pilihBerkas("kamera")}
								onGaleri={() => void pilihBerkas("galeri")}
								onHapus={() => setLampiran(null)}
							/>
						</View>
					) : null}

					<View style={styles.actions}>
						<AppButton
							label="Simpan Draf"
							variant="outline"
							loading={busy}
							onPress={() => void simpan(false)}
							style={styles.action}
						/>
						<AppButton label="Ajukan" loading={busy} onPress={() => void simpan(true)} style={styles.action} />
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}

function LampiranField({
	berkas,
	wajib,
	error,
	onKamera,
	onGaleri,
	onHapus,
}: {
	berkas: BerkasPilihan | null;
	wajib: boolean;
	error?: string;
	onKamera: () => void;
	onGaleri: () => void;
	onHapus: () => void;
}) {
	return (
		<Field label={`Lampiran${wajib ? " *" : " (opsional)"}`} error={error}>
			{berkas ? (
				<View style={styles.lampiranRow}>
					<Text style={styles.lampiranName} numberOfLines={1}>
						{berkas.name}
					</Text>
					<Pressable onPress={onHapus} accessibilityRole="button" hitSlop={8} style={styles.linkBtn}>
						<Text style={styles.linkText}>Hapus</Text>
					</Pressable>
				</View>
			) : (
				<View style={styles.lampiranPick}>
					<AppButton label="Ambil Foto" variant="outline" onPress={onKamera} style={styles.half} />
					<AppButton label="Galeri" variant="outline" onPress={onGaleri} style={styles.half} />
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

	lampiranRow: {
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
	lampiranName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
	lampiranPick: { flexDirection: "row", gap: spacing.sm },
	half: { flex: 1 },
	linkBtn: { paddingVertical: spacing.xs },
	linkText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.danger },

	actions: { gap: spacing.sm, marginTop: spacing.md },
	action: { width: "100%" },
});
