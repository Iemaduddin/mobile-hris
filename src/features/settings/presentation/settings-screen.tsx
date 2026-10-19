import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { appConfig } from "@/core/config/app-config";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView, LoadingView } from "@/core/widgets/states";
import { useNotifications, useSavePreferences } from "@/features/notifications/providers/notifications-queries";
import { ApiException } from "@/core/network/api-exception";

/** Settings — notification preferences, app info, help. */
export function SettingsScreen() {
	const notifications = useNotifications();
	const save = useSavePreferences();

	function toggleChannel(key: "pushEnabled" | "emailEnabled", value: boolean) {
		const current = notifications.data?.preferences ?? { pushEnabled: true, emailEnabled: true };
		save.mutate(
			{ ...current, [key]: value },
			{
				onError: (error) =>
					Alert.alert(
						"Gagal",
						error instanceof ApiException ? error.message : "Preferensi gagal disimpan.",
					),
			},
		);
	}

	const prefs = notifications.data?.preferences ?? { pushEnabled: true, emailEnabled: true };
	const version = Constants.expoConfig?.version ?? "-";

	return (
		<View style={styles.screen}>
			<ScreenHeader title="Settings" />
			{notifications.isPending ? (
				<LoadingView label="Memuat pengaturan..." />
			) : notifications.isError || !notifications.data ? (
				<ErrorView message="Gagal memuat pengaturan." onRetry={() => void notifications.refetch()} />
			) : (
				<ScrollView contentContainerStyle={styles.content}>
					<View style={styles.section}>
						<Text style={styles.heading}>Notification</Text>
						<View style={styles.card}>
							<View style={styles.row}>
								<View style={styles.text}>
									<Text style={styles.label}>Push ke HP</Text>
									<Text style={styles.subtitle}>Pengajuan masuk & keputusan</Text>
								</View>
								<Switch
									value={prefs.pushEnabled}
									onValueChange={(v) => toggleChannel("pushEnabled", v)}
									disabled={save.isPending}
								/>
							</View>
							<View style={[styles.row, styles.divider]}>
								<View style={styles.text}>
									<Text style={styles.label}>Email</Text>
									<Text style={styles.subtitle}>Pengajuan masuk & keputusan</Text>
								</View>
								<Switch
									value={prefs.emailEnabled}
									onValueChange={(v) => toggleChannel("emailEnabled", v)}
									disabled={save.isPending}
								/>
							</View>
						</View>
					</View>

					<View style={styles.section}>
						<Text style={styles.heading}>Aplikasi</Text>
						<View style={styles.card}>
							<View style={styles.row}>
								<Text style={styles.label}>Versi</Text>
								<Text style={styles.value}>{version}</Text>
							</View>
							<View style={[styles.row, styles.divider]}>
								<Text style={styles.label}>Server</Text>
								<Text style={styles.value} numberOfLines={1}>
									{appConfig.apiUrl}
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.section}>
						<Text style={styles.heading}>Keamanan</Text>
						<View style={styles.card}>
							<Pressable
								onPress={() => router.push("/change-password")}
								style={styles.row}
								accessibilityRole="button"
								accessibilityLabel="Ubah kata sandi"
							>
								<View style={styles.text}>
									<Text style={styles.label}>Ubah Kata Sandi</Text>
									<Text style={styles.subtitle}>Ganti sandi akun Anda (minimal 10 karakter)</Text>
								</View>
								<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
							</Pressable>
						</View>
					</View>

					<View style={styles.section}>
						<Text style={styles.heading}>Bantuan</Text>
						<View style={styles.card}>
							<Text style={styles.help}>
								Kendala login, lupa password, atau data salah? Hubungi HR untuk reset dan verifikasi.
							</Text>
						</View>
					</View>

				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
	section: { gap: spacing.xs },
	heading: {
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
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		paddingVertical: spacing.sm,
		minHeight: TOUCH_MIN,
	},
	divider: { borderTopWidth: 1, borderTopColor: colors.border },
	text: { flex: 1, gap: 2 },
	label: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
	subtitle: { fontSize: fontSize.xs, color: colors.textMuted },
	value: { fontSize: fontSize.sm, color: colors.textMuted, flexShrink: 1 },
	help: { fontSize: fontSize.sm, color: colors.text, paddingVertical: spacing.md },
});
