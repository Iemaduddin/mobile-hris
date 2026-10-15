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
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { Field, DateField } from "@/features/requests/presentation/form-fields";
import { ambilFotoLampiran, pilihLampiran } from "@/features/requests/data/pick-lampiran";
import { unggahLampiran, type BerkasPilihan } from "@/features/requests/data/requests-api";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { ApiException } from "@/core/network/api-exception";
import {
	KATEGORI_REIMBURSE,
	formatNominal,
	labelKategori,
} from "../data/reimburse-api";
import { labelStatusReimburse, toneStatusReimburse } from "../models/reimburse";
import { useAksiReimburse, useBuatReimburse, useReimburseSaya } from "../providers/reimburse-queries";

/**
 * Reimbursement — M-ESS-1. Foto struk (kamera/galeri) wajib,
 * nominal + keterangan, kirim langsung untuk diverifikasi.
 */
export function ReimburseScreen() {
	const karyawanId = useAuthStore((s) => s.karyawan?.id);
	const daftar = useReimburseSaya();
	const buat = useBuatReimburse();
	const aksi = useAksiReimburse();

	const [kategori, setKategori] = useState<string>("TRANSPORT");
	const [tanggal, setTanggal] = useState("");
	const [nominal, setNominal] = useState("");
	const [keterangan, setKeterangan] = useState("");
	const [berkas, setBerkas] = useState<BerkasPilihan | null>(null);
	const [mengirim, setMengirim] = useState(false);
	const [galat, setGalat] = useState<string | null>(null);

	const sibuk = mengirim || buat.isPending || aksi.isPending;

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
		const angka = Number(String(nominal).replace(/[^0-9]/g, ""));
		if (!keterangan.trim()) {
			setGalat("Keterangan wajib diisi.");
			return;
		}
		if (!Number.isFinite(angka) || angka <= 0) {
			setGalat("Nominal harus lebih dari 0.");
			return;
		}
		if (!berkas) {
			setGalat("Foto struk wajib dilampirkan.");
			return;
		}
		if (!karyawanId) {
			setGalat("Akun belum tertaut ke data karyawan.");
			return;
		}
		setGalat(null);
		setMengirim(true);
		try {
			// ownerType=pengajuan + ownerId=<karyawanId>, subfolder=lampiran.
			const unggah = await unggahLampiran(berkas, karyawanId);
			const draf = await buat.mutateAsync({
				kategori,
				tanggalKwitansi: tanggal || undefined,
				nominal: angka,
				keterangan: keterangan.trim(),
				lampiranUrl: unggah.path,
			});
			await aksi.mutateAsync({ id: draf.id, aksi: "ajukan" });
			Alert.alert("Terkirim", "Klaim diteruskan untuk verifikasi.");
			setNominal("");
			setKeterangan("");
			setTanggal("");
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
				<ScreenHeader title="Reimbursement" subtitle="Memuat…" />
				<SkeletonLayar jumlah={3} judul={false} />
			</View>
		);
	if (daftar.isError && daftar.data === undefined)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Reimbursement" />
				<ErrorView message="Gagal memuat klaim." onRetry={() => void daftar.refetch()} />
			</View>
		);

	const items = daftar.data ?? [];

	return (
		<View style={styles.layar}>
			<ScreenHeader title="Reimbursement" subtitle={items.length > 0 ? `${items.length} klaim` : undefined} />
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={daftar.isRefetching}
						onRefresh={() => void daftar.refetch()}
						tintColor={colors.primary}
					/>
				}
				ListHeaderComponent={
					<View style={styles.form}>
						<Text style={styles.formJudul}>Klaim Baru</Text>
						<Text style={styles.formSub}>Struk difoto langsung — plafon dicek server.</Text>

						<Field label="Kategori">
							<View style={styles.chips}>
								{KATEGORI_REIMBURSE.map((k) => (
									<Pressable
										key={k}
										onPress={() => setKategori(k)}
										accessibilityRole="button"
										accessibilityState={{ selected: kategori === k }}
										style={[styles.chip, kategori === k && styles.chipAktif]}
									>
										<Text style={[styles.chipText, kategori === k && styles.chipTextAktif]}>
											{labelKategori(k)}
										</Text>
									</Pressable>
								))}
							</View>
						</Field>

						<DateField label="Tanggal kwitansi" value={tanggal} onChange={setTanggal} />

						<AppTextField
							label="Nominal (Rp)"
							value={nominal}
							onChangeText={setNominal}
							keyboardType="numeric"
							placeholder="cth. 150000"
						/>

						<AppTextField
							label="Keterangan"
							value={keterangan}
							onChangeText={setKeterangan}
							placeholder="cth. Bensin dinas Bandung"
						/>

						<Field label="Foto struk (wajib)">
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

						{galat ? <Text style={styles.galat}>{galat}</Text> : null}

						<AppButton label="Kirim Pengajuan" onPress={() => void kirim()} loading={sibuk} />
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada klaim reimbursement." />}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.nomor} numberOfLines={1}>
								{item.nomor}
							</Text>
							<StatusChip label={labelStatusReimburse(item.status)} tone={toneStatusReimburse(item.status)} />
						</View>
						<Text style={styles.keterangan} numberOfLines={2}>
							{item.keterangan}
						</Text>
						<Text style={styles.meta}>
							{labelKategori(item.kategori)} · {formatNominal(item.nominal)}
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
	layar: { flex: 1, backgroundColor: colors.background },
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
	foto: { width: "100%", height: 220, borderRadius: radius.md, backgroundColor: colors.backgroundAlt },
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
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	nomor: { flex: 1, fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	keterangan: { fontSize: fontSize.sm, color: colors.text },
	meta: { fontSize: fontSize.xs, color: colors.textMuted },
	aksiRow: { flexDirection: "row", marginTop: spacing.xs },
	aksiBtn: { flex: 1 },
	gap: { height: spacing.sm },
});
