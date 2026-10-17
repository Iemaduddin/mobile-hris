import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { apiUrl } from "@/core/config/app-config";
import { tokenStore } from "@/core/storage/token-store";
import { colors } from "@/core/theme";

type Props = {
	name: string;
	initials: string;
	/** Photo file path (e.g. `karyawan/<id>/foto.jpg`) — null = initials. */
	photoPath?: string | null;
	size?: number;
};

/**
 * Profile photo avatar (UX-3): show the photo when present, initials otherwise.
 * Downloads use the Bearer header (the files route rejects anonymous calls); load
 * failures fall back to initials automatically — on web too (Image headers unsupported).
 */
export function AvatarPhoto({ name, initials, photoPath, size = 56 }: Props) {
	const [token, setToken] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (photoPath) void tokenStore.get().then(setToken);
	}, [photoPath]);

	if (!photoPath || failed || !token) {
		return (
			<View
				style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
				accessibilityRole="image"
				accessibilityLabel={`Foto ${name}`}
			>
				<Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials}</Text>
			</View>
		);
	}

	return (
		<Image
			source={{
				uri: apiUrl(`/api/files/${photoPath}`),
				headers: { Authorization: `Bearer ${token}` },
			}}
			onError={() => setFailed(true)}
			style={{ width: size, height: size, borderRadius: size / 2 }}
			accessibilityLabel={`Foto ${name}`}
		/>
	);
}

const styles = StyleSheet.create({
	circle: {
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	text: { fontWeight: "800", color: colors.textInverse },
});
