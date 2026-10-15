import { useState } from "react";
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { DateField, Field, TimeField } from "@/features/requests/presentation/form-fields";
import { ambilFotoLampiran, pilihLampiran } from "@/features/requests/data/pick-lampiran";
import { unggahLampiran, type BerkasPilihan } from "@/features/requests/data/requests-api";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { ApiException } from "@/core/network/api-exception";
import { formatTanggal } from "@/core/util/format";
import { TIPE_KOREKSI, labelTipeKoreksi } from "../data/koreksi-api";
import { labelStatusKoreksi, toneStatusKoreksi } from "../models/koreksi";
import { useAksiKoreksi, useBuatKoreksi, useKoreksiSaya } from "../providers/koreksi-queries";

/**
 * Koreksi Presensi — M-ESS-3. Usulan jam benar + bukti opsional,
 * diproses atasan → HR (pengganti koreksi langsung yang ditutup P0-9).
 */
export function KoreksiScreen() {
	const karyawanId = useAuthStore((s) => s.karyawan?.id);
	const daftar = useKoreksiSaya();
	const buat = useBuatKoreksi();
	const aksi = useAksiKoreksi();

	const [tanggal, setTanggal] = useState("");
	const [tipe, setTipe] = useState<string>("MASUK");
	const [jam, setJam] = useState("");
	const [alasan, setAlasan] = useState("");
	const [berkas, setBerkas] = useState<BerkasPilihan | null>(null);
	const [mengirim, setMengirim] = useState(false);
	const [galat, setGalat] = useState<string | null>(null);

	const sibuk = mengirim || buat.isPending || aksi.isPending;

	function pesanGalat(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	async function pilihBukti(sumber: "kamera" | "galeri") {
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
		if (!tanggal) {
			setGalat("Tanggal wajib diisi.");
			return;
		}
		if (!jam) {
			setGalat("Jam seharusnya wajib diisi.");
			return;
		}
		if (!alasan.trim()) {
			setGalat("Alasan wajib diisi.");
			return;
		}
		if (!karyawanId) {
			setGalat("Akun belum tertaut ke data karyawan.");
			return;
		}
		setGalat(null);
		setMengirim(true);
		try {
			let lampiranUrl = "";
			if (berkas) {
				const unggah = await unggahLampiran(berkas, karyawanId);
				lampiranUrl = unggah.path;
			}
			const draf = await buat.mutateAsync({
				tanggal,
				tipe,
				jam,
				alasan: alasan.trim(),
				lampiranUrl,
			});
			await aksi.mutateAsync({ id: draf.id, aksi: "ajukan" });
			Alert.alert("Terkirim", "Koreksi diteruskan ke atasan → HR.");
			setTanggal("");
			setJam("");
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
				<ScreenHeader title="Koreksi Presensi" subtitle="Memuat…" />
				<SkeletonLayar jumlah={3} judul={false} />
			</View>
		);
	if (daftar.isError && daftar.data === undefined)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Koreksi Presensi" />
				<ErrorView message="Gagal memuat koreksi." onRetry={() => void daftar.refetch()} />
			</View>
		);

	const items = daftar.data ?? [];

	return (
		<View style={styles.layar}>
			<ScreenHeader title="Koreksi Presensi" subtitle={items.length > 0 ? `${items.length} usulan` : undefined} />
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
						<Text style={styles.formJudul}>Usulan Baru</Text>
						<Text style={styles.formSub}>Lupa clock-in? Usulkan jam yang benar.</Text>

						<DateField label="Tanggal" value={tanggal} onChange={setTanggal} />

						<Field label="Tipe">
							<View style={styles.chips}>
								{TIPE_KOREKSI.map((t) => (
									<Pressable
										key={t}
										onPress={() => setTipe(t)}
										accessibilityRole="button"
										accessibilityState={{ selected: tipe === t }}
										style={[styles.chip, tipe === t && styles.chipAktif]}
									>
										<Text style={[styles.chipText, tipe === t && styles.chipTextAktif]}>
											{labelTipeKoreksi(t)}
										</Text>
									</Pressable>
								))}
							</View>
						</Field>

						<TimeField label="Jam seharusnya" value={jam} onChange={setJam} />

						<AppTextField
							label="Alasan"
							value={alasan}
							onChangeText={setAlasan}
							placeholder="cth. Lupa clock-in, mesin antre"
						/>

						<Field label="Bukti (opsional)">
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
										<AppButton label="📷 Kamera" variant="outline" onPress={() => void pilihBukti("kamera")} />
									</View>
									<View style={styles.fotoBtn}>
										<AppButton label="🖼 Galeri" variant="outline" onPress={() => void pilihBukti("galeri")} />
									</View>
								</View>
							)}
						</Field>

						{galat ? <Text style={styles.galat}>{galat}</Text> : null}

						<AppButton label="Kirim Usulan" onPress={() => void kirim()} loading={sibuk} />
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada usulan koreksi." />}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.judul} numberOfLines={1}>
								{labelTipeKoreksi(item.tipe)} · {formatTanggal(item.tanggal)}
							</Text>
							<StatusChip label={labelStatusKoreksi(item.status)} tone={toneStatusKoreksi(item.status)} />
						</View>
						<Text style={styles.meta}>
							→ {item.waktuBaru.slice(11, 16)} · {item.alasan}
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
