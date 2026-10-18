import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fontSize, spacing } from "@/core/theme";
import { ApiException } from "@/core/network/api-exception";
import { AppButton } from "@/core/widgets/app-button";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { usePublishAnnouncement } from "../../pengumuman/providers/pengumuman-queries";

/**
 * Terbitkan Pengumuman — M-HR-2. Teks saja, langsung tayang ke karyawan aktif
 * (memakai core pengumuman yang sama dengan web).
 */
export function ComposeAnnouncementScreen() {
	const publish = usePublishAnnouncement();
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const canSubmit = title.trim().length > 0 && body.trim().length > 0;

	function submit() {
		publish.mutate(
			{ title: title.trim(), body: body.trim() },
			{
				onSuccess: (result) => {
					Alert.alert("Terbit", result.message, [
						{ text: "OK", onPress: () => router.back() },
					]);
				},
				onError: (error) => {
					Alert.alert(
						"Gagal",
						error instanceof ApiException ? error.message : "Tidak dapat menerbitkan.",
					);
				},
			},
		);
	}

	return (
		<View style={styles.screen}>
			<ScreenHeader title="Pengumuman Baru" subtitle="Teks saja · langsung tayang" />
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				<AppTextField
					label="Judul"
					placeholder="cth. Perubahan jam kerja Jumat"
					value={title}
					onChangeText={setTitle}
					maxLength={120}
				/>
				<AppTextField
					label="Isi"
					placeholder="Tulis isi pengumuman…"
					value={body}
					onChangeText={setBody}
					multiline
					textAlignVertical="top"
					style={styles.body}
				/>
				<Text style={styles.hint}>
					Setelah diterbitkan, seluruh karyawan aktif menerima pengumuman ini. Tidak ada
					lampiran — gunakan web untuk pengumuman dengan tautan.
				</Text>
				<AppButton
					label="Terbitkan"
					onPress={submit}
					loading={publish.isPending}
					disabled={!canSubmit}
				/>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	body: { minHeight: 160, paddingTop: spacing.md },
	hint: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.lg },
});
