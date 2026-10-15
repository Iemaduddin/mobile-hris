import { useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { DateField } from "@/features/requests/presentation/form-fields";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { ApiException } from "@/core/network/api-exception";
import { formatTanggal } from "@/core/util/format";
import { estimasiAngsuran, formatRupiahKasbon, type KasbonSaya } from "../data/kasbon-api";
import { labelStatusKasbon, toneStatusKasbon } from "../models/kasbon";
import { useAksiKasbon, useBuatKasbon, useKasbonSaya } from "../providers/kasbon-queries";

const TENOR_PILIHAN = [3, 6, 10, 12, 24];

function progres(angsuranKe: number, tenorBulan: number): number {
	if (!tenorBulan || tenorBulan <= 0) return 0;
	return Math.min(1, Math.max(0, angsuranKe / tenorBulan));
}

/**
 * Kasbon Saya — M-ESS-2. Simulasi angsuran sebelum kirim;
 * pelunasan otomatis dipotong gaji tiap salary run.
 */
export function KasbonScreen() {
	const karyawan = useAuthStore((s) => s.karyawan);
	const daftar = useKasbonSaya();
	const buat = useBuatKasbon();
	const aksi = useAksiKasbon();

	const [nominal, setNominal] = useState("");
	const [tenor, setTenor] = useState(10);
	const [tenorLain, setTenorLain] = useState("");
	const [mulai, setMulai] = useState("");
	const [alasan, setAlasan] = useState("");
	const [galat, setGalat] = useState<string | null>(null);

	const sibuk = buat.isPending || aksi.isPending;
	const angkaNominal = Number(String(nominal).replace(/[^0-9]/g, ""));
	const tenorPakai = tenorLain.trim() ? Number(tenorLain) : tenor;
	const angsuran = estimasiAngsuran(angkaNominal, tenorPakai);

	function pesanGalat(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	function kirim() {
		if (!karyawan) {
			setGalat("Akun belum tertaut ke data karyawan.");
			return;
		}
		if (!Number.isFinite(angkaNominal) || angkaNominal <= 0) {
			setGalat("Nominal harus lebih dari 0.");
			return;
		}
		if (!Number.isFinite(tenorPakai) || tenorPakai < 1) {
			setGalat("Tenor minimal 1 bulan.");
			return;
		}
		if (!alasan.trim()) {
			setGalat("Alasan wajib diisi.");
			return;
		}
		setGalat(null);
		buat.mutate(
			{ nominal: angkaNominal, tenorBulan: Math.floor(tenorPakai), mulaiPotong: mulai, alasan: alasan.trim() },
			{
				onSuccess: async (draf) => {
					try {
						await aksi.mutateAsync({ id: draf.id, aksi: "ajukan" });
						Alert.alert("Terkirim", "Pengajuan kasbon diteruskan ke Finance.");
					} catch (error) {
						Alert.alert("Draf tersimpan", `Gagal mengajukan otomatis: ${pesanGalat(error)}`);
					}
					setNominal("");
					setTenorLain("");
					setMulai("");
					setAlasan("");
				},
				onError: (error) => setGalat(pesanGalat(error)),
			},
		);
	}

	if (daftar.isPending)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Kasbon Saya" subtitle="Memuat…" />
				<SkeletonLayar jumlah={3} judul={false} />
			</View>
		);
	if (daftar.isError && daftar.data === undefined)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Kasbon Saya" />
				<ErrorView message="Gagal memuat kasbon." onRetry={() => void daftar.refetch()} />
			</View>
		);

	const items = daftar.data ?? [];

	return (
		<View style={styles.layar}>
			<ScreenHeader title="Kasbon Saya" subtitle={items.length > 0 ? `${items.length} pengajuan` : undefined} />
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
						<Text style={styles.formJudul}>Pengajuan Baru</Text>
						<Text style={styles.formSub}>Dicicil otomatis potong gaji tiap run.</Text>

						<AppTextField
							label="Nominal (Rp)"
							value={nominal}
							onChangeText={setNominal}
							keyboardType="numeric"
							placeholder="cth. 10000000"
						/>

						<Text style={styles.label}>Tenor (bulan)</Text>
						<View style={styles.chips}>
							{TENOR_PILIHAN.map((t) => (
								<Pressable
									key={t}
									onPress={() => {
										setTenor(t);
										setTenorLain("");
									}}
									accessibilityRole="button"
									accessibilityState={{ selected: !tenorLain && tenor === t }}
									style={[styles.chip, !tenorLain && tenor === t && styles.chipAktif]}
								>
									<Text style={[styles.chipText, !tenorLain && tenor === t && styles.chipTextAktif]}>
										{t}x
									</Text>
								</Pressable>
							))}
						</View>
						<AppTextField
							label="Tenor lain (opsional)"
							value={tenorLain}
							onChangeText={setTenorLain}
							keyboardType="numeric"
							placeholder="cth. 8"
						/>

						<DateField label="Mulai potong" value={mulai} onChange={setMulai} />

						<AppTextField
							label="Alasan"
							value={alasan}
							onChangeText={setAlasan}
							placeholder="cth. Biaya sekolah anak"
						/>

						{anggsuranBox(angkaNominal, tenorPakai, angsuran)}

						{galat ? <Text style={styles.galat}>{galat}</Text> : null}

						<AppButton label="Kirim Pengajuan" onPress={kirim} loading={sibuk} />
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada pengajuan kasbon." />}
				renderItem={({ item }) => (
					<KartuKasbon
						data={item}
						sibuk={sibuk}
						onAjukan={() =>
							aksi.mutate(
								{ id: item.id, aksi: "ajukan" },
								{ onError: (e) => Alert.alert("Gagal", pesanGalat(e)) },
							)
						}
						onBatal={() =>
							aksi.mutate(
								{ id: item.id, aksi: "batal" },
								{ onError: (e) => Alert.alert("Gagal", pesanGalat(e)) },
							)
						}
					/>
				)}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

function anggsuranBox(nominal: number, tenor: number, angsuran: number) {
	if (!Number.isFinite(nominal) || nominal <= 0 || angsuran <= 0) return null;
	return (
		<View style={styles.simulasi}>
			<Text style={styles.simulasiLabel}>Estimasi cicilan</Text>
			<Text style={styles.simulasiNilai}>
				{formatRupiahKasbon(angsuran)} × {Math.floor(tenor)} bln
			</Text>
		</View>
	);
}

function KartuKasbon({
	data,
	sibuk,
	onAjukan,
	onBatal,
}: {
	data: KasbonSaya;
	sibuk: boolean;
	onAjukan: () => void;
	onBatal: () => void;
}) {
	const p = progres(data.angsuranKe, data.tenorBulan);
	return (
		<View style={styles.card}>
			<View style={styles.cardHead}>
				<Text style={styles.nomor} numberOfLines={1}>
					{data.nomor}
				</Text>
				<StatusChip label={labelStatusKasbon(data.status)} tone={toneStatusKasbon(data.status)} />
			</View>
			<Text style={styles.nominalBesar}>{formatRupiahKasbon(data.nominal)}</Text>
			<Text style={styles.meta}>
				{formatRupiahKasbon(data.angsuranPerBulan)}/bln · {data.angsuranKe}/{data.tenorBulan} cicilan · mulai{" "}
				{formatTanggal(data.mulaiPotong)}
			</Text>
			<Text style={styles.meta}>Sisa: {formatRupiahKasbon(data.sisaHutang)}</Text>
			<View style={styles.bar}>
				<View style={[styles.isi, { flex: p }]} />
				<View style={{ flex: 1 - p }} />
			</View>
			{data.catatan ? <Text style={styles.catatan}>“{data.catatan}”</Text> : null}
			{data.status === "DRAFT" ? (
				<View style={styles.aksiRow}>
					<View style={styles.aksiBtn}>
						<AppButton label="Ajukan" onPress={onAjukan} loading={sibuk} />
					</View>
					<View style={styles.aksiBtn}>
						<AppButton label="Batal" variant="outline" onPress={onBatal} loading={sibuk} />
					</View>
				</View>
			) : null}
			{data.status === "DIAJUKAN" ? (
				<View style={styles.aksiRow}>
					<View style={styles.aksiBtn}>
						<AppButton label="Batalkan" variant="outline" onPress={onBatal} loading={sibuk} />
					</View>
				</View>
			) : null}
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
	label: { fontSize: fontSize.sm, color: colors.textMuted },
	chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
	chip: {
		minHeight: 38,
		minWidth: 56,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.md,
		borderRadius: radius.full,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	chipAktif: { backgroundColor: colors.primary, borderColor: colors.primary },
	chipText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
	chipTextAktif: { color: colors.textInverse },
	simulasi: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: colors.primaryLight,
		borderRadius: radius.md,
		padding: spacing.md,
	},
	simulasiLabel: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: "700" },
	simulasiNilai: { fontSize: fontSize.sm, fontWeight: "800", color: colors.primaryDark },
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
	nominalBesar: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
	meta: { fontSize: fontSize.xs, color: colors.textMuted },
	bar: { flexDirection: "row", height: 8, borderRadius: 4, backgroundColor: colors.backgroundAlt, overflow: "hidden" },
	isi: { backgroundColor: colors.success },
	catatan: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: "italic" },
	aksiRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
	aksiBtn: { flex: 1 },
	gap: { height: spacing.sm },
});
