import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { formatTanggal } from "@/core/util/format";
import { AppButton } from "@/core/widgets/app-button";
import { EmptyView, ErrorView, LoadingView } from "@/core/widgets/states";
import {
	useCutiList,
	useDinasList,
	useLemburList,
	useSaldoCuti,
} from "../providers/requests-queries";
import {
	daftarJenisPengajuan,
	FILTER_STATUS,
	labelJenisPengajuan,
	type JenisPengajuan,
	type PengajuanCuti,
	type PengajuanDinas,
	type PengajuanLembur,
} from "../models/request";
import { RequestCard, type KartuPengajuan } from "./request-card";

const TAHUN = new Date().getFullYear();

const BATAS_AWAL = 20;
const TAMBAH_BATAS = 20;

function keKartuCuti(x: PengajuanCuti): KartuPengajuan {
	return {
		id: x.id,
		jenis: "cuti",
		status: x.status,
		nomor: x.nomor,
		judul: x.jenisNama,
		rentang: `${formatTanggal(x.mulai)} – ${formatTanggal(x.selesai)}`,
		keterangan: `${x.jumlahHari} hari${x.menggunakanSaldo ? " · memakai saldo" : ""}`,
	};
}

function keKartuLembur(x: PengajuanLembur): KartuPengajuan {
	return {
		id: x.id,
		jenis: "lembur",
		status: x.status,
		judul: "Lembur",
		rentang: `${formatTanggal(x.tanggal)} · ${x.jamMulai}–${x.jamSelesai}`,
		keterangan: `${x.jumlahJam} jam · ${x.alasan}`,
	};
}

function keKartuDinas(x: PengajuanDinas): KartuPengajuan {
	return {
		id: x.id,
		jenis: "dinas",
		status: x.status,
		nomor: x.nomor,
		judul: x.jenis === "WFH" ? "WFH" : "Dinas Luar",
		rentang: `${formatTanggal(x.mulai)} – ${formatTanggal(x.selesai)}`,
		keterangan: x.lokasi ?? undefined,
	};
}

/**
 * Tab Pengajuan — daftar cuti/lembur/dinas + saldo (PRD mobile Bag. 5.4).
 * Layar buat & detail ditumpuk di `src/app/requests/`.
 */
export function RequestsScreen() {
	const [jenis, setJenis] = useState<JenisPengajuan>("cuti");
	const [status, setStatus] = useState("");
	const [batas, setBatas] = useState(BATAS_AWAL);

	const saldo = useSaldoCuti(TAHUN);
	const cutiQ = useCutiList(status);
	const lemburQ = useLemburList(status);
	const dinasQ = useDinasList(status);

	function pilihJenis(j: JenisPengajuan) {
		setJenis(j);
		setBatas(BATAS_AWAL);
	}

	function pilihStatus(s: string) {
		setStatus(s);
		setBatas(BATAS_AWAL);
	}

	const aktif = jenis === "cuti" ? cutiQ : jenis === "lembur" ? lemburQ : dinasQ;

	if (aktif.isPending) return <LoadingView label="Memuat pengajuan..." />;
	if (aktif.isError && aktif.data === undefined)
		return <ErrorView message="Gagal memuat daftar pengajuan." onRetry={() => void aktif.refetch()} />;

	const kartu =
		jenis === "cuti"
			? (cutiQ.data ?? []).map(keKartuCuti)
			: jenis === "lembur"
				? (lemburQ.data ?? []).map(keKartuLembur)
				: (dinasQ.data ?? []).map(keKartuDinas);

	const kartuTampil = kartu.slice(0, batas);
	const sisa = kartu.length - kartuTampil.length;

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<FlatList
				data={kartuTampil}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={aktif.isRefetching}
						onRefresh={() => void aktif.refetch()}
						tintColor={colors.primary}
					/>
				}
				ListHeaderComponent={
					<View style={styles.head}>
						<Text style={styles.title}>Pengajuan</Text>
						<SaldoCard rows={saldo.data?.saldo ?? []} loading={saldo.isPending} />
						<View style={styles.segmented}>
							{daftarJenisPengajuan.map((j) => (
								<Pressable
									key={j}
									onPress={() => pilihJenis(j)}
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
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.chips}
						>
							{FILTER_STATUS.map((f) => (
								<Pressable
									key={f.value}
									onPress={() => pilihStatus(f.value)}
									accessibilityRole="button"
									style={[styles.chip, status === f.value ? styles.chipActive : null]}
								>
									<Text
										style={[styles.chipText, status === f.value ? styles.chipTextActive : null]}
									>
										{f.label}
									</Text>
								</Pressable>
							))}
						</ScrollView>
					</View>
				}
				ListEmptyComponent={
					<EmptyView
						message={`Belum ada pengajuan ${labelJenisPengajuan(jenis).toLowerCase()}${
							status ? " dengan filter ini" : ""
						}.`}
					/>
				}
				renderItem={({ item }) => (
					<RequestCard
						data={item}
						onPress={() =>
							router.push({ pathname: "/requests/detail", params: { id: item.id, jenis: item.jenis } })
						}
					/>
				)}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
				ListFooterComponent={
					sisa > 0 ? (
						<View style={styles.muatLagi}>
							<AppButton
								label={`Muat lagi (${sisa} tersisa)`}
								variant="outline"
								onPress={() => setBatas((b) => b + TAMBAH_BATAS)}
							/>
						</View>
					) : null
				}
			/>
			<View style={styles.footer}>
				<AppButton
					label="Buat Baru"
					onPress={() => router.push({ pathname: "/requests/new", params: { jenis } })}
				/>
			</View>
		</SafeAreaView>
	);
}

function SaldoCard({
	rows,
	loading,
}: {
	rows: { jenisNama: string; saldoAkhir: string; tahun: number }[];
	loading: boolean;
}) {
	if (loading || rows.length === 0) return null;

	return (
		<View style={styles.saldoCard}>
			<Text style={styles.saldoTitle}>Sisa saldo cuti {rows[0].tahun}</Text>
			{rows.map((r) => (
				<View key={r.jenisNama} style={styles.saldoRow}>
					<Text style={styles.saldoNama}>{r.jenisNama}</Text>
					<Text style={styles.saldoNilai}>{r.saldoAkhir} hari</Text>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	head: { gap: spacing.md, marginBottom: spacing.sm },
	title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },

	saldoCard: {
		backgroundColor: colors.primaryLight,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.primary,
		padding: spacing.md,
		gap: spacing.xs,
	},
	saldoTitle: { fontSize: fontSize.xs, fontWeight: "700", color: colors.primaryDark },
	saldoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	saldoNama: { fontSize: fontSize.sm, color: colors.text },
	saldoNilai: { fontSize: fontSize.sm, fontWeight: "700", color: colors.primaryDark },

	segmented: {
		flexDirection: "row",
		backgroundColor: colors.backgroundAlt,
		borderRadius: radius.full,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 3,
		gap: 3,
	},
	seg: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
	segActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
	segText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
	segTextActive: { color: colors.primary },

	chips: { gap: spacing.xs, paddingRight: spacing.sm },
	chip: {
		minHeight: 32,
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

	gap: { height: spacing.sm },
	muatLagi: { paddingVertical: spacing.sm },
	footer: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		backgroundColor: colors.background,
	},
});
