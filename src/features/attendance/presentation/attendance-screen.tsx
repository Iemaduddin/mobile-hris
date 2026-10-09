import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton, ErrorView, LoadingView, Notice, type NoticeProps } from "@/core/widgets";
import { ambilPosisi, pesanGagalPosisi, type PosisiPerangkat } from "@/core/location/location-service";
import { hitungJarakMeter, validasiRadius } from "@/core/location/geo";
import { lokasiKerjaSaya } from "@/features/auth/models/session";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import {
	formatJam,
	formatTanggalPanjang,
	labelStatusRekap,
	labelTipePresensi,
} from "@/core/util/format";
import { useClock, useStatusHariIni, type HasilAksi } from "../providers/attendance-queries";
import type { TipePresensi } from "../models/attendance";

type HasilCek =
	| { ok: true; posisi: PosisiPerangkat; diLuarRadius: boolean | null; jarakMeter: number | null }
	| { ok: false; pesan: string };

/**
 * Layar Presensi (PRD mobile Bag. 5.3.A-C):
 * status hari ini, tombol clock-in/out dengan GPS, dan daftar event.
 */
export default function PresensiScreen() {
	const karyawan = useAuthStore((s) => s.karyawan);
	const lokasi = lokasiKerjaSaya(karyawan);
	const { data, isLoading, isError, refetch } = useStatusHariIni();
	const { clock, fase, isSending } = useClock();

	const [notice, setNotice] = useState<NoticeProps | null>(null);
	const [hasilCek, setHasilCek] = useState<HasilCek | null>(null);
	const [memeriksaLokasi, setMemeriksaLokasi] = useState(false);

	const events = useMemo(() => data?.events ?? [], [data]);
	const sudahMasuk = events.some((event) => event.tipe === "MASUK");
	const sudahPulang = events.some((event) => event.tipe === "KELUAR");
	const sedangProses = fase !== "idle" || isSending;

	const konfirmasiGpsPalsu = useCallback(
		() =>
			new Promise<boolean>((resolve) => {
				Alert.alert(
					"Lokasi terdeteksi simulasi",
					"Lokasi terdeteksi simulasi (mock) — presensi tetap tercatat dan ditandai.",
					[
						{ text: "Batal", style: "cancel", onPress: () => resolve(false) },
						{ text: "Tetap Kirim", onPress: () => resolve(true) },
					],
				);
			}),
		[],
	);

	const jalankan = useCallback(
		async (tipe: TipePresensi) => {
			setNotice(null);
			const hasil = await clock(tipe, { konfirmasiGpsPalsu });

			if (hasil.status === "tercatat") {
				setNotice(noticeDariHasil(hasil));
			} else if (hasil.status === "gagal") {
				setNotice({ tone: "danger", title: "Gagal mencatat presensi", description: hasil.pesan });
			}
		},
		[clock, konfirmasiGpsPalsu],
	);

	const periksaLokasi = useCallback(async () => {
		setMemeriksaLokasi(true);
		try {
			const hasil = await ambilPosisi();
			if (!hasil.ok) {
				setHasilCek({ ok: false, pesan: pesanGagalPosisi(hasil.reason) });
				return;
			}
			setHasilCek({
				ok: true,
				posisi: hasil.posisi,
				diLuarRadius: validasiRadius(hasil.posisi, lokasi),
				jarakMeter:
					lokasi?.latitude != null && lokasi?.longitude != null
						? Math.round(
								hitungJarakMeter(
									hasil.posisi.latitude,
									hasil.posisi.longitude,
									lokasi.latitude,
									lokasi.longitude,
								),
							)
						: null,
			});
		} finally {
			setMemeriksaLokasi(false);
		}
	}, [lokasi]);

	if (isLoading) return <LoadingView />;
	if (isError || !data) {
		return <ErrorView message="Gagal memuat status presensi." onRetry={() => void refetch()} />;
	}

	const tanpaJadwal = data.status === "TANPA_JADWAL";

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>Presensi</Text>
					<Text style={styles.subtitle}>{formatTanggalPanjang(new Date())}</Text>
				</View>

				{notice ? <Notice {...notice} /> : null}

				<View style={styles.card}>
					<Text style={styles.cardLabel}>Status hari ini</Text>
					<Text style={[styles.status, tanpaJadwal && styles.statusNetral]}>
						{labelStatusRekap(data.status)}
					</Text>
					{data.telatMenit ? <Text style={styles.telat}>Telat {data.telatMenit} menit</Text> : null}

					<View style={styles.jamRow}>
						<View style={styles.jamItem}>
							<Text style={styles.jamLabel}>Masuk</Text>
							<Text style={styles.jamValue}>{formatJam(data.masukAktual)}</Text>
						</View>
						<View style={styles.divider} />
						<View style={styles.jamItem}>
							<Text style={styles.jamLabel}>Pulang</Text>
							<Text style={styles.jamValue}>{formatJam(data.keluarAktual)}</Text>
						</View>
					</View>
				</View>

				<View style={styles.card}>
					<View style={styles.rowBetween}>
						<View style={{ flex: 1 }}>
							<Text style={styles.cardLabel}>Lokasi kerja</Text>
							<Text style={styles.lokasiNama}>{lokasi?.nama ?? "Belum ditentukan"}</Text>
							<Text style={styles.lokasiMeta}>
								{lokasi?.radiusMeter
									? `Radius validasi ${lokasi.radiusMeter} m`
									: "Lokasi ini belum mengatur radius"}
							</Text>
						</View>
						<Pressable
							onPress={() => void periksaLokasi()}
							disabled={memeriksaLokasi}
							style={styles.cekBtn}
							accessibilityRole="button"
						>
							{memeriksaLokasi ? (
								<ActivityIndicator size="small" color={colors.primary} />
							) : (
								<Text style={styles.cekLabel}>Cek lokasi</Text>
							)}
						</Pressable>
					</View>

					{hasilCek ? (
						<View style={styles.cekHasil}>
							{hasilCek.ok ? (
								<>
									<Text style={styles.cekHasilText}>
										{hasilCek.jarakMeter == null
											? "Koordinat terbaca."
											: `Jarak ke lokasi: ${hasilCek.jarakMeter} m`}
									</Text>
									<Text style={[styles.cekHasilText, styles[warnaRadius(hasilCek.diLuarRadius)]]}>
										{labelRadius(hasilCek.diLuarRadius)}
									</Text>
									{hasilCek.posisi.isMocked ? (
										<Text style={[styles.cekHasilText, styles.teksWarning]}>
											GPS terdeteksi simulasi (mock).
										</Text>
									) : null}
								</>
							) : (
								<Text style={styles.cekHasilText}>{hasilCek.pesan}</Text>
							)}
						</View>
					) : null}
				</View>

				<View style={styles.tombolRow}>
					<AppButton
						label="MASUK"
						onPress={() => void jalankan("MASUK")}
						loading={sedangProses}
						disabled={sedangProses || sudahMasuk}
						style={styles.tombol}
					/>
					<AppButton
						label="KELUAR"
						variant="outline"
						onPress={() => void jalankan("KELUAR")}
						loading={sedangProses}
						disabled={sedangProses || !sudahMasuk || sudahPulang}
						style={styles.tombol}
					/>
				</View>

				{fase === "mengambil_lokasi" ? (
					<Text style={styles.prosesText}>Mengambil lokasi perangkat…</Text>
				) : null}
				{fase === "mengirim" ? <Text style={styles.prosesText}>Mengirim presensi…</Text> : null}

				<View style={styles.card}>
					<View style={styles.rowBetween}>
						<Text style={styles.cardLabel}>Event hari ini</Text>
						<Link href="/attendance/riwayat" asChild>
							<Pressable accessibilityRole="button" hitSlop={8}>
								<Text style={styles.cekLabel}>Riwayat</Text>
							</Pressable>
						</Link>
					</View>

					{events.length === 0 ? (
						<Text style={styles.kosong}>Belum ada event presensi hari ini.</Text>
					) : (
						events.map((event) => (
							<View key={`${event.tipe}-${event.waktu}`} style={styles.eventRow}>
								<View style={{ flex: 1 }}>
									<Text style={styles.eventTipe}>{labelTipePresensi(event.tipe)}</Text>
									<Text style={styles.eventMeta}>
										{formatJam(event.waktu)} · {event.sumber}
									</Text>
								</View>
								<View style={styles.eventFlags}>
									{event.diLuarRadius ? (
										<Text style={[styles.flag, styles.flagDanger]}>Luar radius</Text>
									) : null}
									{event.isMocked ? <Text style={[styles.flag, styles.flagWarning]}>Mock</Text> : null}
								</View>
							</View>
						))
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function labelRadius(diLuarRadius: boolean | null): string {
	if (diLuarRadius === null) return "Lokasi belum dapat dinilai (belum ada radius).";
	return diLuarRadius ? "Di luar radius validasi." : "Di dalam radius validasi.";
}

function warnaRadius(diLuarRadius: boolean | null): "teksDanger" | "teksSuccess" | "teksMuted" {
	if (diLuarRadius === null) return "teksMuted";
	return diLuarRadius ? "teksDanger" : "teksSuccess";
}

/** Susun banner hasil clock-in sesuai PRD mobile Bag. 5.3.A but.4. */
function noticeDariHasil(hasil: Extract<HasilAksi, { status: "tercatat" }>): NoticeProps {
	const { data, peringatanLokasi } = hasil;
	const bagian: string[] = [];

	if (data.diLuarRadius === true) {
		bagian.push(
			data.jarakMeter != null
				? `Di luar radius — jarak ${data.jarakMeter} m dari lokasi kerja.`
				: "Di luar radius lokasi kerja.",
		);
	} else if (data.diLuarRadius === false) {
		bagian.push("Di dalam radius lokasi kerja.");
	} else {
		bagian.push("Lokasi tidak dinilai (tanpa GPS atau lokasi tanpa radius).");
	}

	if (data.isMocked) {
		bagian.push("Lokasi terdeteksi simulasi (mock) dan disimpan dengan flag.");
	}
	if (peringatanLokasi) bagian.push(peringatanLokasi);

	const bermasalah = data.diLuarRadius === true || data.isMocked;

	return {
		tone: bermasalah ? "warning" : "success",
		title: `${labelTipePresensi(data.tipe)} tercatat · ${formatJam(data.waktu)}`,
		description: bagian.join(" "),
	};
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
	header: { gap: spacing.xs },
	title: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.text },
	subtitle: { fontSize: fontSize.sm, color: colors.textMuted },

	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.lg,
		gap: spacing.sm,
	},
	cardLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" },
	status: { fontSize: fontSize.xl, fontWeight: "700", color: colors.success },
	statusNetral: { color: colors.textMuted },
	telat: { fontSize: fontSize.sm, color: colors.warning, fontWeight: "600" },
	jamRow: { flexDirection: "row", marginTop: spacing.sm },
	jamItem: { flex: 1, gap: spacing.xs },
	jamLabel: { fontSize: fontSize.xs, color: colors.textMuted },
	jamValue: { fontSize: fontSize.lg, fontWeight: "600", color: colors.text },
	divider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },

	rowBetween: { flexDirection: "row", alignItems: "center", gap: spacing.md },
	lokasiNama: { fontSize: fontSize.md, fontWeight: "600", color: colors.text, marginTop: spacing.xs },
	lokasiMeta: { fontSize: fontSize.xs, color: colors.textMuted },
	cekBtn: {
		minHeight: TOUCH_MIN,
		justifyContent: "center",
		paddingHorizontal: spacing.md,
		borderRadius: radius.full,
		borderWidth: 1.5,
		borderColor: colors.primary,
	},
	cekLabel: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
	cekHasil: {
		marginTop: spacing.sm,
		padding: spacing.md,
		borderRadius: radius.md,
		backgroundColor: colors.backgroundAlt,
		gap: spacing.xs,
	},
	cekHasilText: { fontSize: fontSize.sm, color: colors.text },
	teksDanger: { color: colors.danger, fontWeight: "600" },
	teksSuccess: { color: colors.success, fontWeight: "600" },
	teksWarning: { color: colors.warning, fontWeight: "600" },
	teksMuted: { color: colors.textMuted },

	tombolRow: { flexDirection: "row", gap: spacing.md },
	tombol: { flex: 1 },
	prosesText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center" },

	kosong: { fontSize: fontSize.sm, color: colors.textMuted },
	eventRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	eventTipe: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
	eventMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
	eventFlags: { flexDirection: "row", gap: spacing.xs },
	flag: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: radius.full,
		overflow: "hidden",
	},
	flagDanger: { backgroundColor: colors.dangerLight, color: colors.danger },
	flagWarning: { backgroundColor: colors.warningLight, color: colors.warning },
});
