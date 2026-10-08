import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { formatJam, formatTanggalPanjang, labelStatusRekap } from "@/core/util/format";
import { AppButton } from "@/core/widgets/app-button";
import { labelPenempatan } from "@/features/auth/models/session";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { useStatusHariIni } from "@/features/attendance/providers/attendance-queries";
import {
	useCutiList,
	useDinasList,
	useLemburList,
	useSaldoCuti,
} from "@/features/requests/providers/requests-queries";
import { useSlipList } from "@/features/payslip/providers/payslip-queries";
import { formatRupiah, labelPeriode } from "@/features/payslip/models/payslip";

const TAHUN = new Date().getFullYear();

/** Status yang masih berjalan (belum diputuskan). */
const STATUS_BERJALAN = new Set(["DRAFT", "DIAJUKAN", "MENUNGGU_APPROVAL"]);

type KartuProps = {
	judul: string;
	sub?: string;
	tekan?: () => void;
	children?: React.ReactNode;
};

/**
 * Beranda / Dashboard ESS (PRD mobile Bag. 5.2).
 * Komposisi dari endpoint yang sudah ada: presensi hari ini, sisa cuti,
 * pengajuan berjalan, dan slip gaji terakhir — semua milik sendiri.
 */
export function HomeScreen() {
	const user = useAuthStore((s) => s.user);
	const karyawan = useAuthStore((s) => s.karyawan);

	const presensi = useStatusHariIni();
	const saldo = useSaldoCuti(TAHUN);
	const cuti = useCutiList();
	const lembur = useLemburList();
	const dinas = useDinasList();
	const slip = useSlipList();

	const semua = [presensi, saldo, cuti, lembur, dinas, slip];
	const memuat = semua.some((q) => q.isPending);
	const refetchSemua = () => {
		void Promise.all(semua.map((q) => q.refetch()));
	};

	const penempatan = labelPenempatan(karyawan);
	const status = presensi.data?.status ?? null;
	const masuk = presensi.data?.masukAktual;
	const keluar = presensi.data?.keluarAktual;

	const berjalan = [ ...(cuti.data ?? []), ...(lembur.data ?? []), ...(dinas.data ?? []) ].filter(
		(x) => STATUS_BERJALAN.has(x.status),
	);
	const slipTerakhir = slip.data?.[0] ?? null;

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={!memuat && presensi.isRefetching}
						onRefresh={refetchSemua}
						tintColor={colors.primary}
					/>
				}
			>
				<View style={styles.sapaan}>
					<Text style={styles.halo}>Halo,</Text>
					<Text style={styles.nama}>{karyawan?.namaLengkap ?? user?.name ?? "-"}</Text>
					<Text style={styles.tanggal}>{formatTanggalPanjang(new Date())}</Text>
					{penempatan ? <Text style={styles.penempatan}>{penempatan}</Text> : null}
				</View>

				<Kartu judul="Presensi hari ini" tekan={() => router.push("/attendance")}>
					{status ? (
						<>
							<Text style={styles.statusPresensi}>{labelStatusRekap(status)}</Text>
							<Text style={styles.jam}>
								{masuk ? formatJam(masuk) : "--:--"} – {keluar ? formatJam(keluar) : "--:--"}
							</Text>
						</>
					) : (
						<Text style={styles.jam}>Memuat status...</Text>
					)}
				</Kartu>

				<Kartu judul={`Sisa saldo cuti ${TAHUN}`}>
					{saldo.data?.saldo.length ? (
						saldo.data.saldo.map((s) => (
							<View key={s.id} style={styles.baris}>
								<Text style={styles.barisLabel}>{s.jenisNama}</Text>
								<Text style={styles.barisNilai}>{s.saldoAkhir} hari</Text>
							</View>
						))
					) : (
						<Text style={styles.jam}>Belum ada saldo cuti.</Text>
					)}
				</Kartu>

				<Kartu
					judul="Pengajuan berjalan"
					sub={berjalan.length > 0 ? `${berjalan.length} pengajuan` : undefined}
					tekan={() => router.push("/requests")}
				>
					{berjalan.length > 0 ? (
						<Text style={styles.jam}>{berjalan[0].status.replace(/_/g, " ")} terakhir</Text>
					) : (
						<Text style={styles.jam}>Tidak ada pengajuan berjalan.</Text>
					)}
				</Kartu>

				<Kartu
					judul="Slip gaji terakhir"
					sub={slipTerakhir ? labelPeriode(slipTerakhir.periode) : undefined}
					tekan={() => router.push("/payslip")}
				>
					{slipTerakhir ? (
						<Text style={styles.slipNilai}>{formatRupiah(slipTerakhir.gajiBersih)}</Text>
					) : (
						<Text style={styles.jam}>Belum ada slip gaji terbit.</Text>
					)}
				</Kartu>

				<View style={styles.aksi}>
					<Aksi icon="calendar-outline" label="Jadwal" onPress={() => router.push("/schedule")} />
					<Aksi icon="document-text-outline" label="Slip Gaji" onPress={() => router.push("/payslip")} />
					<Aksi icon="person-outline" label="Profil" onPress={() => router.push("/profile")} />
				</View>

				<AppButton
					label="Lihat Semua Presensi"
					variant="outline"
					onPress={() => router.push("/attendance/riwayat")}
				/>
			</ScrollView>
		</SafeAreaView>
	);
}

function Kartu({ judul, sub, tekan, children }: KartuProps) {
	const isi = (
		<View style={styles.kartu}>
			<View style={styles.kartuHead}>
				<Text style={styles.kartuJudul}>{judul}</Text>
				{sub ? <Text style={styles.kartuSub}>{sub}</Text> : null}
			</View>
			<View>{children}</View>
			{tekan ? <Text style={styles.kartuAksi}>Lihat ›</Text> : null}
		</View>
	);

	if (!tekan) return isi;

	return (
		<Pressable
			onPress={tekan}
			accessibilityRole="button"
			accessibilityLabel={judul}
			style={({ pressed }) => [pressed && styles.kartuPressed]}
		>
			{isi}
		</Pressable>
	);
}

function Aksi({
	icon,
	label,
	onPress,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={label}
			style={({ pressed }) => [styles.aksiItem, pressed && styles.kartuPressed]}
		>
			<Ionicons name={icon} size={22} color={colors.primary} />
			<Text style={styles.aksiLabel}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },

	sapaan: { gap: 2, marginBottom: spacing.sm },
	halo: { fontSize: fontSize.sm, color: colors.textMuted },
	nama: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
	tanggal: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
	penempatan: { fontSize: fontSize.xs, color: colors.textMuted },

	kartu: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.lg,
		gap: spacing.sm,
	},
	kartuPressed: { backgroundColor: colors.backgroundAlt },
	kartuHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	kartuJudul: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	kartuSub: { fontSize: fontSize.xs, color: colors.textMuted },
	kartuAksi: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" },

	statusPresensi: { fontSize: fontSize.lg, fontWeight: "800", color: colors.success },
	jam: { fontSize: fontSize.sm, color: colors.textMuted },
	slipNilai: { fontSize: fontSize.lg, fontWeight: "700", color: colors.success },

	baris: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	barisLabel: { fontSize: fontSize.sm, color: colors.text },
	barisNilai: { fontSize: fontSize.sm, fontWeight: "700", color: colors.primaryDark },

	aksi: { flexDirection: "row", gap: spacing.sm },
	aksiItem: {
		flex: 1,
		minHeight: TOUCH_MIN + 12,
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		paddingVertical: spacing.md,
	},
	aksiLabel: { fontSize: fontSize.xs, color: colors.text, fontWeight: "600" },
});
