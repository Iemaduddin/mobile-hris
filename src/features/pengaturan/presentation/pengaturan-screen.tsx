import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Constants from "expo-constants";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { appConfig } from "@/core/config/app-config";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView, LoadingView } from "@/core/widgets/states";
import { useNotifikasi, useSimpanPreferensi } from "@/features/notifikasi/providers/notifikasi-queries";
import { ApiException } from "@/core/network/api-exception";

/** Pengaturan — preferensi notifikasi, info aplikasi, bantuan. */
export function PengaturanScreen() {
	const notifikasi = useNotifikasi();
	const simpan = useSimpanPreferensi();

	function alihKanal(kunci: "pushAktif" | "emailAktif", nilai: boolean) {
		const saatIni = notifikasi.data?.preferensi ?? { pushAktif: true, emailAktif: true };
		simpan.mutate(
			{ ...saatIni, [kunci]: nilai },
			{
				onError: (error) =>
					Alert.alert(
						"Gagal",
						error instanceof ApiException ? error.message : "Preferensi gagal disimpan.",
					),
			},
		);
	}

	const pref = notifikasi.data?.preferensi ?? { pushAktif: true, emailAktif: true };
	const versi = Constants.expoConfig?.version ?? "-";

	return (
		<View style={styles.layar}>
			<ScreenHeader title="Pengaturan" />
			{notifikasi.isPending ? (
				<LoadingView label="Memuat pengaturan..." />
			) : notifikasi.isError || !notifikasi.data ? (
				<ErrorView message="Gagal memuat pengaturan." onRetry={() => void notifikasi.refetch()} />
			) : (
				<ScrollView contentContainerStyle={styles.content}>
					<View style={styles.bagian}>
						<Text style={styles.judul}>Notifikasi</Text>
						<View style={styles.card}>
							<View style={styles.baris}>
								<View style={styles.teks}>
									<Text style={styles.label}>Push ke HP</Text>
									<Text style={styles.sub}>Pengajuan masuk & keputusan</Text>
								</View>
								<Switch
									value={pref.pushAktif}
									onValueChange={(v) => alihKanal("pushAktif", v)}
									disabled={simpan.isPending}
								/>
							</View>
							<View style={[styles.baris, styles.batas]}>
								<View style={styles.teks}>
									<Text style={styles.label}>Email</Text>
									<Text style={styles.sub}>Pengajuan masuk & keputusan</Text>
								</View>
								<Switch
									value={pref.emailAktif}
									onValueChange={(v) => alihKanal("emailAktif", v)}
									disabled={simpan.isPending}
								/>
							</View>
						</View>
					</View>

					<View style={styles.bagian}>
						<Text style={styles.judul}>Aplikasi</Text>
						<View style={styles.card}>
							<View style={styles.baris}>
								<Text style={styles.label}>Versi</Text>
								<Text style={styles.nilai}>{versi}</Text>
							</View>
							<View style={[styles.baris, styles.batas]}>
								<Text style={styles.label}>Server</Text>
								<Text style={styles.nilai} numberOfLines={1}>
									{appConfig.apiUrl}
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.bagian}>
						<Text style={styles.judul}>Bantuan</Text>
						<View style={styles.card}>
							<Text style={styles.bantuan}>
								Kendala login, data salah, atau lupa password? Hubungi HR untuk reset dan verifikasi.
							</Text>
						</View>
					</View>

				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	layar: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
	bagian: { gap: spacing.xs },
	judul: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		paddingHorizontal: spacing.md,
	},
	baris: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		paddingVertical: spacing.sm,
		minHeight: TOUCH_MIN,
	},
	batas: { borderTopWidth: 1, borderTopColor: colors.border },
	teks: { flex: 1, gap: 2 },
	label: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
	sub: { fontSize: fontSize.xs, color: colors.textMuted },
	nilai: { fontSize: fontSize.sm, color: colors.textMuted, flexShrink: 1 },
	bantuan: { fontSize: fontSize.sm, color: colors.text, paddingVertical: spacing.md },
});
