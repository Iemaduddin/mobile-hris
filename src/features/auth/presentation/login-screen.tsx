import { useState } from "react";
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton, AppTextField } from "@/core/widgets";
import { useAuthStore } from "../providers/auth-store";

/**
 * Layar login (PRD mobile Bag. 5.1).
 * Sukses → auth-store menyimpan token & state jadi signedIn,
 * router otomatis mengalihkan ke Beranda lewat auth gate di app/_layout.
 */
export function LoginScreen() {
	const signIn = useAuthStore((s) => s.signIn);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [tampilPassword, setTampilPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit() {
		if (!email.trim() || !password) {
			setError("Email dan password wajib diisi.");
			return;
		}
		setError(null);
		setLoading(true);
		try {
			await signIn(email.trim().toLowerCase(), password);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Login gagal. Coba lagi.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.header}>
						<Image
							source={require("../../../../assets/images/logo-app.png")}
							style={styles.logo}
							resizeMode="contain"
							accessibilityLabel="Logo HRIS"
						/>
						<Text style={styles.brand}>HRIS</Text>
						<Text style={styles.subtitle}>Selamat datang — masuk ke akun karyawan Anda</Text>
					</View>

					<View style={styles.card}>
						<AppTextField
							label="Email"
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="email-address"
							placeholder="nama@perusahaan.com"
							returnKeyType="next"
						/>

						<View style={styles.fieldWrap}>
							<Text style={styles.label}>Password</Text>
							<View style={styles.passwordRow}>
								<TextInput
									placeholderTextColor={colors.textMuted}
									style={styles.passwordInput}
									value={password}
									onChangeText={setPassword}
									secureTextEntry={!tampilPassword}
									placeholder="••••••••"
									autoCapitalize="none"
									autoCorrect={false}
									returnKeyType="done"
									onSubmitEditing={() => void handleSubmit()}
								/>
								<Pressable
									onPress={() => setTampilPassword((v) => !v)}
									accessibilityRole="button"
									accessibilityLabel={tampilPassword ? "Sembunyikan password" : "Tampilkan password"}
									style={styles.eye}
								>
									<Ionicons
										name={tampilPassword ? "eye-off-outline" : "eye-outline"}
										size={22}
										color={colors.textMuted}
									/>
								</Pressable>
							</View>
						</View>

						{error ? (
							<View style={styles.errorBox}>
								<Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
								<Text style={styles.error} accessibilityRole="alert">
									{error}
								</Text>
							</View>
						) : null}

						<AppButton label="Masuk" onPress={handleSubmit} loading={loading} />
					</View>

					<Text style={styles.hint}>Lupa password? Hubungi HR untuk reset.</Text>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.backgroundAlt },
	flex: { flex: 1 },
	content: { flexGrow: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.xl },
	header: { alignItems: "center", gap: spacing.sm },
	logo: { width: 96, height: 96, borderRadius: 24 },
	brand: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.text, letterSpacing: 4 },
	subtitle: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center" },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.xl,
		gap: spacing.md,
		shadowColor: "#0F172A",
		shadowOpacity: 0.06,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 8 },
		elevation: 3,
	},
	fieldWrap: { marginBottom: spacing.lg },
	label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs },
	passwordRow: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: TOUCH_MIN,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		backgroundColor: colors.surface,
		paddingLeft: spacing.md,
	},
	passwordInput: { flex: 1, fontSize: fontSize.md, color: colors.text, paddingVertical: spacing.md },
	eye: {
		minWidth: TOUCH_MIN,
		minHeight: TOUCH_MIN,
		alignItems: "center",
		justifyContent: "center",
	},
	errorBox: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		backgroundColor: colors.dangerLight,
		borderRadius: radius.md,
		padding: spacing.md,
	},
	error: { flex: 1, color: colors.danger, fontSize: fontSize.sm },
	hint: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: "center" },
});
