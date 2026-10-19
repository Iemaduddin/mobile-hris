import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { AppButton, AppTextField, Notice, ScreenHeader, type NoticeProps } from "@/core/widgets";
import { ApiException } from "@/core/network/api-exception";
import { MIN_PASSWORD_LENGTH } from "../models/password";
import { useChangePassword } from "../providers/profile-queries";

type FieldErrors = {
	current?: string;
	next?: string;
	confirm?: string;
};

/**
 * P6-5 — ubah kata sandi dari dalam aplikasi (mobile PRD Bag. 5.6).
 * Kebijakan sandi & verifikasi sandi lama tetap di server; layar ini hanya
 * memberi validasi cepat sebelum kirim.
 */
export function ChangePasswordScreen() {
	const change = useChangePassword();

	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [notice, setNotice] = useState<NoticeProps | null>(null);

	function validate(): FieldErrors {
		const found: FieldErrors = {};
		if (!current) found.current = "Kata sandi saat ini wajib diisi.";
		if (!next) found.next = "Kata sandi baru wajib diisi.";
		else if (next.length < MIN_PASSWORD_LENGTH)
			found.next = `Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter.`;
		else if (next === current) found.next = "Kata sandi baru harus berbeda dari kata sandi saat ini.";
		if (confirm !== next) found.confirm = "Ulangi kata sandi baru dengan sama.";
		return found;
	}

	async function handleSubmit() {
		setNotice(null);
		const found = validate();
		setErrors(found);
		if (Object.keys(found).length > 0) return;

		try {
			const result = await change.mutateAsync({ currentPassword: current, newPassword: next });
			setCurrent("");
			setNext("");
			setConfirm("");
			setNotice({ tone: "success", title: "Kata sandi diubah", description: result.message });
		} catch (error) {
			setNotice({
				tone: "danger",
				title: "Gagal mengubah kata sandi",
				description:
					error instanceof ApiException && error.isUnauthorized
						? "Sesi Anda berakhir. Masuk ulang lalu coba lagi."
						: error instanceof ApiException
							? error.message
							: "Gagal menghubungi server. Coba lagi.",
			});
		}
	}

	return (
		<View style={styles.screen}>
			<ScreenHeader title="Ubah Kata Sandi" />
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					{notice ? <Notice {...notice} /> : null}

					<View style={styles.card}>
						<AppTextField
							label="Kata sandi saat ini"
							value={current}
							onChangeText={setCurrent}
							secureTextEntry
							autoCapitalize="none"
							autoCorrect={false}
							textContentType="password"
							error={errors.current}
						/>
						<AppTextField
							label="Kata sandi baru"
							value={next}
							onChangeText={setNext}
							secureTextEntry
							autoCapitalize="none"
							autoCorrect={false}
							textContentType="newPassword"
							error={errors.next}
						/>
						<AppTextField
							label="Ulangi kata sandi baru"
							value={confirm}
							onChangeText={setConfirm}
							secureTextEntry
							autoCapitalize="none"
							autoCorrect={false}
							textContentType="newPassword"
							error={errors.confirm}
						/>
						<Text style={styles.hint}>
							Minimal {MIN_PASSWORD_LENGTH} karakter. Setelah diubah, sesi di perangkat lain
							otomatis diputus dan Anda tetap masuk di perangkat ini.
						</Text>
					</View>

					<AppButton
						label="Simpan Kata Sandi"
						onPress={() => void handleSubmit()}
						loading={change.isPending}
					/>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	flex: { flex: 1 },
	content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.lg,
	},
	hint: { fontSize: fontSize.xs, color: colors.textMuted },
});
