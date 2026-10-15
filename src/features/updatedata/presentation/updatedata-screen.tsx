import { useState } from "react";
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView } from "@/core/widgets/states";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { DateField, Field } from "@/features/requests/presentation/form-fields";
import { ambilFotoLampiran, pilihLampiran } from "@/features/requests/data/pick-lampiran";
import { unggahLampiran, type BerkasPilihan } from "@/features/requests/data/requests-api";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { ApiException } from "@/core/network/api-exception";
import {
	GELAR,
	GENDER,
	HUBUNGAN,
	JENIS_DOKUMEN,
	KATEGORI_UPDATE,
	labelKategoriUpdate,
} from "../data/updatedata-api";
import { labelStatusUpdateData, toneStatusUpdateData } from "../models/updatedata";
import {
	useAksiUpdateData,
	useBuatUpdateData,
	useKeluargaSaya,
	useUpdateDataSaya,
} from "../providers/updatedata-queries";

function labelEnum(v: string): string {
	return v.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Update Data — M-ESS-5. Usulan alamat/kontak/keluarga/pendidikan/dokumen,
 * diverifikasi HR sebelum diterapkan. Sensitif (NIK/rekening) tetap via HR.
 */
export function UpdateDataScreen() {
	const karyawanId = useAuthStore((s) => s.karyawan?.id);
	const daftar = useUpdateDataSaya();
	const keluarga = useKeluargaSaya();
	const buat = useBuatUpdateData();
	const aksi = useAksiUpdateData();

	const [kategori, setKategori] = useState<string>("ALAMAT");
	const [form, setForm] = useState<Record<string, string>>({});
	const [alasan, setAlasan] = useState("");
	const [berkas, setBerkas] = useState<BerkasPilihan | null>(null);
	const [mengirim, setMengirim] = useState(false);
	const [galat, setGalat] = useState<string | null>(null);

	const sibuk = mengirim || buat.isPending || aksi.isPending;

	function set(k: string, v: string) {
		setForm((prev) => ({ ...prev, [k]: v }));
	}

	function gantiKategori(k: string) {
		setKategori(k);
		setForm({});
		setBerkas(null);
		setGalat(null);
	}

	function pesanGalat(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	async function pilihFoto(sumber: "kamera" | "galeri") {
		const hasil = sumber === "kamera" ? await ambilFotoLampiran() : await pilihLampiran();
		if (hasil.status === "dipilih") {
			setBerkas(hasil.berkas);
			setGalat(null);
		} else if (hasil.status === "izin_ditolak") {
			Alert.alert("Izin dibutuhkan", "Aktifkan izin kamera/galeri di pengaturan perangkat.");
		} else if (hasil.status === "kebesaran") {
			Alert.alert("Terlalu besar", "Ukuran foto maksimal 10 MB.");
		}
	}

	async function kirim() {
		if (!alasan.trim()) {
			setGalat("Alasan perubahan wajib diisi.");
			return;
		}
		if (!karyawanId) {
			setGalat("Akun belum tertaut ke data karyawan.");
			return;
		}
		const dataBaru: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(form)) {
			if (v !== "") dataBaru[k] = v;
		}
		if (kategori === "KELUARGA" && form.targetId === "baru") delete dataBaru.targetId;
		if (kategori === "DOKUMEN" && berkas) {
			try {
				const unggah = await unggahLampiran(berkas, karyawanId);
				dataBaru.urlFile = unggah.path;
			} catch (error) {
				setGalat(`Gagal mengunggah dokumen: ${pesanGalat(error)}`);
				return;
			}
		}
		setGalat(null);
		setMengirim(true);
		try {
			const draf = await buat.mutateAsync({
				kategori,
				targetId:
					kategori === "KELUARGA" && form.targetId && form.targetId !== "baru" ? form.targetId : undefined,
				dataBaru,
				alasan: alasan.trim(),
			});
			await aksi.mutateAsync({ id: draf.id, aksi: "ajukan" });
			Alert.alert("Terkirim", "Usulan diteruskan ke HR untuk verifikasi.");
			setForm({});
			setAlasan("");
			setBerkas(null);
		} catch (error) {
			setGalat(pesanGalat(error));
		} finally {
			setMengirim(false);
		}
	}

	if (daftar.isPending)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Update Data" subtitle="Memuat…" />
				<SkeletonLayar jumlah={3} judul={false} />
			</View>
		);
	if (daftar.isError && daftar.data === undefined)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Update Data" />
				<ErrorView message="Gagal memuat usulan." onRetry={() => void daftar.refetch()} />
			</View>
		);

	const items = daftar.data ?? [];
	const anggota = keluarga.data ?? [];

	return (
		<View style={styles.layar}>
			<ScreenHeader title="Update Data" subtitle={items.length > 0 ? `${items.length} usulan` : undefined} />
			<FlatList
				data={[{ kunci: "form" }]}
				keyExtractor={(item) => item.kunci}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={daftar.isRefetching}
						onRefresh={() => void daftar.refetch()}
						tintColor={colors.primary}
					/>
				}
				renderItem={() => (
					<View style={styles.gapBesar}>
						<View style={styles.form}>
							<Text style={styles.formJudul}>Usulan Baru</Text>
							<Text style={styles.formSub}>Diverifikasi HR sebelum diterapkan.</Text>

							<Field label="Kategori">
								<View style={styles.chips}>
									{KATEGORI_UPDATE.map((k) => (
										<Pressable
											key={k}
											onPress={() => gantiKategori(k)}
											accessibilityRole="button"
											accessibilityState={{ selected: kategori === k }}
											style={[styles.chip, kategori === k && styles.chipAktif]}
										>
											<Text style={[styles.chipText, kategori === k && styles.chipTextAktif]}>
												{labelKategoriUpdate(k)}
											</Text>
										</Pressable>
									))}
								</View>
							</Field>

							{kategori === "ALAMAT" && (
								<AppTextField
									label="Alamat baru"
									value={form.alamat ?? ""}
									onChangeText={(v) => set("alamat", v)}
									placeholder="cth. Jl. Baru No. 10"
								/>
							)}

							{kategori === "KONTAK" && (
								<>
									<AppTextField
										label="Telepon baru"
										value={form.telepon ?? ""}
										onChangeText={(v) => set("telepon", v)}
										keyboardType="phone-pad"
										placeholder="cth. 081234567890"
									/>
									<AppTextField
										label="Email baru"
										value={form.email ?? ""}
										onChangeText={(v) => set("email", v)}
										keyboardType="email-address"
										autoCapitalize="none"
										placeholder="cth. nama@baru.id"
									/>
								</>
							)}

							{kategori === "KELUARGA" && (
								<>
									<Field label="Target">
										<View style={styles.chips}>
											<Pressable
												onPress={() => set("targetId", "baru")}
												accessibilityRole="button"
												style={[styles.chip, (form.targetId ?? "baru") === "baru" && styles.chipAktif]}
											>
												<Text
													style={[styles.chipText, (form.targetId ?? "baru") === "baru" && styles.chipTextAktif]}
												>
													Anggota baru
												</Text>
											</Pressable>
											{anggota.map((a) => (
												<Pressable
													key={a.id}
													onPress={() => set("targetId", a.id)}
													accessibilityRole="button"
													style={[styles.chip, form.targetId === a.id && styles.chipAktif]}
												>
													<Text style={[styles.chipText, form.targetId === a.id && styles.chipTextAktif]}>
														{a.nama}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<AppTextField label="Nama" value={form.nama ?? ""} onChangeText={(v) => set("nama", v)} />
									<Field label="Hubungan">
										<View style={styles.chips}>
											{HUBUNGAN.map((h) => (
												<Pressable
													key={h}
													onPress={() => set("hubungan", h)}
													accessibilityRole="button"
													style={[styles.chip, form.hubungan === h && styles.chipAktif]}
												>
													<Text style={[styles.chipText, form.hubungan === h && styles.chipTextAktif]}>
														{labelEnum(h)}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<Field label="Jenis kelamin">
										<View style={styles.chips}>
											{GENDER.map((g) => (
												<Pressable
													key={g}
													onPress={() => set("gender", g)}
													accessibilityRole="button"
													style={[styles.chip, form.gender === g && styles.chipAktif]}
												>
													<Text style={[styles.chipText, form.gender === g && styles.chipTextAktif]}>
														{labelEnum(g)}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<DateField
										label="Tanggal lahir"
										value={form.tanggalLahir ?? ""}
										onChange={(v) => set("tanggalLahir", v)}
									/>
									<AppTextField label="NIK (opsional)" value={form.nik ?? ""} onChangeText={(v) => set("nik", v)} keyboardType="numeric" />
									<AppTextField label="Pekerjaan (opsional)" value={form.pekerjaan ?? ""} onChangeText={(v) => set("pekerjaan", v)} />
								</>
							)}

							{kategori === "PENDIDIKAN" && (
								<>
									<Field label="Gelar">
										<View style={styles.chips}>
											{GELAR.map((g) => (
												<Pressable
													key={g}
													onPress={() => set("gelar", g)}
													accessibilityRole="button"
													style={[styles.chip, form.gelar === g && styles.chipAktif]}
												>
													<Text style={[styles.chipText, form.gelar === g && styles.chipTextAktif]}>
														{g.replace("_", "/")}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<AppTextField label="Institusi" value={form.institusi ?? ""} onChangeText={(v) => set("institusi", v)} />
									<AppTextField label="Jurusan (opsional)" value={form.jurusan ?? ""} onChangeText={(v) => set("jurusan", v)} />
									<AppTextField label="Tahun mulai (opsional)" value={form.tahunMulai ?? ""} onChangeText={(v) => set("tahunMulai", v)} keyboardType="numeric" />
									<AppTextField label="Tahun lulus (opsional)" value={form.tahunLulus ?? ""} onChangeText={(v) => set("tahunLulus", v)} keyboardType="numeric" />
									<AppTextField label="IPK (opsional)" value={form.ipk ?? ""} onChangeText={(v) => set("ipk", v)} keyboardType="decimal-pad" />
								</>
							)}

							{kategori === "DOKUMEN" && (
								<>
									<Field label="Jenis dokumen">
										<View style={styles.chips}>
											{JENIS_DOKUMEN.map((j) => (
												<Pressable
													key={j}
													onPress={() => set("jenisDokumen", j)}
													accessibilityRole="button"
													style={[styles.chip, form.jenisDokumen === j && styles.chipAktif]}
												>
													<Text style={[styles.chipText, form.jenisDokumen === j && styles.chipTextAktif]}>
														{labelEnum(j)}
													</Text>
												</Pressable>
											))}
										</View>
									</Field>
									<AppTextField label="Nama dokumen" value={form.nama ?? ""} onChangeText={(v) => set("nama", v)} />
									<Field label="File (foto)">
										{berkas ? (
											<View style={styles.pratinjau}>
												<Image source={{ uri: berkas.uri }} style={styles.foto} resizeMode="cover" />
												<Pressable
													onPress={() => setBerkas(null)}
													accessibilityRole="button"
													accessibilityLabel="Hapus foto"
													style={styles.hapusFoto}
												>
													<Text style={styles.hapusFotoText}>✕ Hapus</Text>
												</Pressable>
											</View>
										) : (
											<View style={styles.fotoRow}>
												<View style={styles.fotoBtn}>
													<AppButton label="📷 Kamera" variant="outline" onPress={() => void pilihFoto("kamera")} />
												</View>
												<View style={styles.fotoBtn}>
													<AppButton label="🖼 Galeri" variant="outline" onPress={() => void pilihFoto("galeri")} />
												</View>
											</View>
										)}
									</Field>
									<DateField
										label="Kadaluarsa (opsional)"
										value={form.tanggalKadaluarsa ?? ""}
										onChange={(v) => set("tanggalKadaluarsa", v)}
									/>
									<AppTextField label="Catatan (opsional)" value={form.catatan ?? ""} onChangeText={(v) => set("catatan", v)} />
								</>
							)}

							<AppTextField
								label="Alasan perubahan"
								value={alasan}
								onChangeText={setAlasan}
								placeholder="cth. Pindah rumah"
							/>

							{galat ? <Text style={styles.galat}>{galat}</Text> : null}

							<AppButton label="Kirim Usulan" onPress={() => void kirim()} loading={sibuk} />
						</View>

						<View style={styles.seksi}>
							<Text style={styles.seksiJudul}>Usulan saya ({items.length})</Text>
							{items.length === 0 ? (
								<Text style={styles.meta}>Belum ada usulan.</Text>
							) : (
								items.map((item) => (
									<View key={item.id} style={styles.card}>
										<View style={styles.cardHead}>
											<Text style={styles.judul} numberOfLines={1}>
												{item.nomor}
											</Text>
											<StatusChip label={labelStatusUpdateData(item.status)} tone={toneStatusUpdateData(item.status)} />
										</View>
										<Text style={styles.meta} numberOfLines={2}>
											{item.ringkasan}
										</Text>
										{item.status === "DRAFT" ? (
											<View style={styles.aksiRow}>
												<View style={styles.aksiBtn}>
													<AppButton
														label="Ajukan"
														onPress={() =>
															aksi.mutate(
																{ id: item.id, aksi: "ajukan" },
																{ onError: (e) => Alert.alert("Gagal", pesanGalat(e)) },
															)
														}
														loading={aksi.isPending}
													/>
												</View>
												<View style={styles.aksiBtn}>
													<AppButton
														label="Batal"
														variant="outline"
														onPress={() =>
															aksi.mutate(
																{ id: item.id, aksi: "batal" },
																{ onError: (e) => Alert.alert("Gagal", pesanGalat(e)) },
															)
														}
														loading={aksi.isPending}
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
	layar: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	gapBesar: { gap: spacing.lg },
	form: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	formJudul: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	formSub: { fontSize: fontSize.xs, color: colors.textMuted },
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
	chipAktif: { backgroundColor: colors.primary, borderColor: colors.primary },
	chipText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "600" },
	chipTextAktif: { color: colors.textInverse },
	pratinjau: { gap: spacing.sm },
	foto: { width: "100%", height: 200, borderRadius: radius.md, backgroundColor: colors.backgroundAlt },
	fotoRow: { flexDirection: "row", gap: spacing.sm },
	fotoBtn: { flex: 1 },
	hapusFoto: {
		minHeight: TOUCH_MIN,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.danger,
	},
	hapusFotoText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.danger },
	galat: { fontSize: fontSize.xs, color: colors.danger },
	seksi: { gap: spacing.sm },
	seksiJudul: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	judul: { flex: 1, fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	meta: { fontSize: fontSize.xs, color: colors.textMuted },
	aksiRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	aksiBtn: { flex: 1 },
	gap: { height: spacing.sm },
});
