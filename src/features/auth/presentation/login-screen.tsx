import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, spacing } from "@/core/theme";
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
						<Text style={styles.brand}>HRIS</Text>
						<Text style={styles.subtitle}>Masuk ke akun karyawan Anda</Text>
					</View>

					<View>
						<AppTextField
							label="Email"
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="email-address"
							placeholder="nama@perusahaan.com"
						/>
						<AppTextField
							label="Password"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							placeholder="••••••••"
						/>

						{error ? (
							<Text style={styles.error} accessibilityRole="alert">
								{error}
							</Text>
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
	safe: { flex: 1, backgroundColor: colors.background },
	flex: { flex: 1 },
	content: { flexGrow: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.xxl },
	header: { alignItems: "center", gap: spacing.sm },
	brand: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.primary },
	subtitle: { fontSize: fontSize.md, color: colors.textMuted },
	error: {
		color: colors.danger,
		fontSize: fontSize.sm,
		marginBottom: spacing.md,
		textAlign: "center",
	},
	hint: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: "center" },
});
