import { useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView } from "@/core/widgets/states";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { DateField, Field } from "@/features/requests/presentation/form-fields";
import { ApiException } from "@/core/network/api-exception";
import { formatTanggal } from "@/core/util/format";
import type { TukarItem } from "../data/tukar-api";
import { labelStatusTukar, toneStatusTukar } from "../models/tukar";
import { useAksiTukar, useBuatTukar, usePasanganTukar, useTukarSaya } from "../providers/tukar-queries";

/**
 * Tukar Shift — M-ESS-4. Usulan ke pasangan (tanggal sama),
 * pasangan setuju → HR final, roster ditukar atomik.
 */
export function TukarScreen() {
	const daftar = useTukarSaya();
	const pasangan = usePasanganTukar();
	const buat = useBuatTukar();
	const aksi = useAksiTukar();

	const [tanggal, setTanggal] = useState("");
	const [cari, setCari] = useState("");
	const [pasanganId, setPasanganId] = useState("");
	const [alasan, setAlasan] = useState("");
	const [galat, setGalat] = useState<string | null>(null);

	const sibuk = buat.isPending || aksi.isPending;
	const opsi = (pasangan.data ?? []).filter((o) =>
		cari.trim() ? o.label.toLowerCase().includes(cari.trim().toLowerCase()) : true,
	);

	function pesanGalat(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	function kirim() {
		if (!tanggal) {
			setGalat("Tanggal wajib diisi.");
			return;
		}
		if (!pasanganId) {
			setGalat("Pilih pasangan tukar.");
			return;
		}
		if (!alasan.trim()) {
			setGalat("Alasan wajib diisi.");
			return;
		}
		setGalat(null);
		buat.mutate(
			{ pasanganKaryawanId: pasanganId, tanggal, alasan: alasan.trim() },
			{
				onSuccess: async (draf) => {
					try {
						await aksi.mutateAsync({ id: draf.id, aksi: "ajukan" });
						Alert.alert("Terkirim", "Usulan diteruskan ke pasangan → HR.");
					} catch (error) {
						Alert.alert("Draf tersimpan", `Gagal mengajukan otomatis: ${pesanGalat(error)}`);
					}
					setTanggal("");
					setPasanganId("");
					setCari("");
					setAlasan("");
				},
				onError: (error) => setGalat(pesanGalat(error)),
			},
		);
	}

	if (daftar.isPending)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Tukar Shift" subtitle="Memuat…" />
				<SkeletonLayar jumlah={3} judul={false} />
			</View>
		);
	if (daftar.isError && daftar.data === undefined)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Tukar Shift" />
				<ErrorView message="Gagal memuat tukar shift." onRetry={() => void daftar.refetch()} />
			</View>
		);

	const keluar = daftar.data?.keluar ?? [];
	const masuk = daftar.data?.masuk ?? [];

	return (
		<View style={styles.layar}>
			<ScreenHeader title="Tukar Shift" subtitle="Tanggal sama · pasangan → HR" />
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

							<DateField label="Tanggal" value={tanggal} onChange={setTanggal} />

							<Field label="Pasangan tukar">
								<AppTextField
									label="Cari karyawan"
									value={cari}
									onChangeText={(teks) => {
										setCari(teks);
										setPasanganId("");
									}}
									placeholder="Cari nama / nomor…"
								/>
								{pasangan.isPending ? (
									<Text style={styles.meta}>Memuat daftar karyawan…</Text>
								) : (
									<View style={styles.opsi}>
										{opsi.slice(0, 8).map((o) => (
											<Pressable
												key={o.value}
												onPress={() => {
													setPasanganId(o.value);
													setCari(o.label);
												}}
												accessibilityRole="button"
												style={[styles.opsiItem, pasanganId === o.value && styles.opsiAktif]}
											>
												<Text
													style={[styles.opsiText, pasanganId === o.value && styles.opsiTextAktif]}
													numberOfLines={1}
												>
													{o.label}
												</Text>
											</Pressable>
										))}
										{opsi.length > 8 ? (
											<Text style={styles.meta}>+{opsi.length - 8} lagi — persempit pencarian</Text>
										) : opsi.length === 0 ? (
											<Text style={styles.meta}>Tidak ketemu.</Text>
										) : null}
									</View>
								)}
							</Field>

							<AppTextField
								label="Alasan"
								value={alasan}
								onChangeText={setAlasan}
								placeholder="cth. Ada acara keluarga"
							/>

							{galat ? <Text style={styles.galat}>{galat}</Text> : null}

							<AppButton label="Kirim Usulan" onPress={kirim} loading={sibuk} />
						</View>

						<Seksi
							judul={`Masuk untuk saya (${masuk.length})`}
							items={masuk}
							kosong="Tidak ada usulan masuk."
							sibuk={sibuk}
							mode="masuk"
							pesanGalat={pesanGalat}
						/>

						<Seksi
							judul={`Usulan saya (${keluar.length})`}
							items={keluar}
							kosong="Belum ada usulan keluar."
							sibuk={sibuk}
							mode="keluar"
							pesanGalat={pesanGalat}
						/>
					</View>
				)}
			/>
		</View>
	);
}

function Seksi({
	judul,
	items,
	kosong,
	sibuk,
	mode,
	pesanGalat,
}: {
	judul: string;
	items: TukarItem[];
	kosong: string;
	sibuk: boolean;
	mode: "masuk" | "keluar";
	pesanGalat: (error: unknown) => string;
}) {
	return (
		<View style={styles.seksi}>
			<Text style={styles.seksiJudul}>{judul}</Text>
			{items.length === 0 ? (
				<Text style={styles.meta}>{kosong}</Text>
			) : (
				items.map((item) => (
					<KartuTukar key={item.id} data={item} sibuk={sibuk} mode={mode} pesanGalat={pesanGalat} />
				))
			)}
		</View>
	);
}

function KartuTukar({
	data,
	sibuk,
	mode,
	pesanGalat,
}: {
	data: TukarItem;
	sibuk: boolean;
	mode: "masuk" | "keluar";
	pesanGalat: (error: unknown) => string;
}) {
	const aksi = useAksiTukar();
	const [tampilTolak, setTampilTolak] = useState(false);
	const [alasanTolak, setAlasanTolak] = useState("");

	function tolak() {
		if (!alasanTolak.trim()) {
			Alert.alert("Dibatalkan", "Alasan penolakan wajib diisi.");
			return;
		}
		aksi.mutate(
			{ id: data.id, aksi: "tolak", catatan: alasanTolak.trim() },
			{
				onSuccess: () => {
					setTampilTolak(false);
					setAlasanTolak("");
				},
				onError: (e) => Alert.alert("Gagal", pesanGalat(e)),
			},
		);
	}

	return (
		<View style={styles.card}>
			<View style={styles.cardHead}>
				<Text style={styles.judul} numberOfLines={1}>
					{formatTanggal(data.tanggal)} · {data.lawanNama}
				</Text>
				<StatusChip label={labelStatusTukar(data.status)} tone={toneStatusTukar(data.status)} />
			</View>
			<Text style={styles.meta}>
				Saya: {data.shiftSaya} ⇄ Lawan: {data.shiftLawan}
			</Text>
			{mode === "keluar" && (data.status === "DRAFT" || data.status === "DIAJUKAN") ? (
				<View style={styles.aksiRow}>
					{data.status === "DRAFT" ? (
						<View style={styles.aksiBtn}>
							<AppButton
								label="Ajukan"
								loading={sibuk || aksi.isPending}
								onPress={() =>
									aksi.mutate(
										{ id: data.id, aksi: "ajukan" },
										{ onError: (e) => Alert.alert("Gagal", pesanGalat(e)) },
									)
								}
							/>
						</View>
					) : null}
					<View style={styles.aksiBtn}>
						<AppButton
							label="Batalkan"
							variant="outline"
							loading={sibuk || aksi.isPending}
							onPress={() =>
								aksi.mutate(
									{ id: data.id, aksi: "batal" },
									{ onError: (e) => Alert.alert("Gagal", pesanGalat(e)) },
								)
							}
						/>
					</View>
				</View>
			) : null}
			{mode === "masuk" && data.status === "DIAJUKAN" ? (
				tampilTolak ? (
					<View style={styles.tolakBox}>
						<AppTextField
							label="Alasan penolakan"
							value={alasanTolak}
							onChangeText={setAlasanTolak}
							placeholder="cth. Jadwal bentrok"
						/>
						<View style={styles.aksiRow}>
							<View style={styles.aksiBtn}>
								<AppButton label="Kirim Tolak" variant="danger" loading={aksi.isPending} onPress={tolak} />
							</View>
							<View style={styles.aksiBtn}>
								<AppButton label="Batal" variant="outline" onPress={() => setTampilTolak(false)} />
							</View>
						</View>
					</View>
				) : (
					<View style={styles.aksiRow}>
						<View style={styles.aksiBtn}>
							<AppButton
								label="Setuju"
								loading={sibuk || aksi.isPending}
								onPress={() =>
									aksi.mutate(
										{ id: data.id, aksi: "setuju" },
										{ onError: (e) => Alert.alert("Gagal", pesanGalat(e)) },
									)
								}
							/>
						</View>
						<View style={styles.aksiBtn}>
							<AppButton label="Tolak" variant="danger" onPress={() => setTampilTolak(true)} />
						</View>
					</View>
				)
			) : null}
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
	opsi: { gap: spacing.xs, marginTop: spacing.xs },
	opsiItem: {
		minHeight: TOUCH_MIN,
		justifyContent: "center",
		paddingHorizontal: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	opsiAktif: { backgroundColor: colors.primary, borderColor: colors.primary },
	opsiText: { fontSize: fontSize.sm, color: colors.text },
	opsiTextAktif: { color: colors.textInverse, fontWeight: "700" },
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
	tolakBox: { gap: spacing.sm, marginTop: spacing.xs },
});
