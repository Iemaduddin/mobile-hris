import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { apiUrl } from "@/core/config/app-config";
import { tokenStore } from "@/core/storage/token-store";
import { colors } from "@/core/theme";

type Props = {
	nama: string;
	inisial: string;
	/** Path berkas foto (mis. `karyawan/<id>/foto.jpg`) — null = inisial. */
	fotoPath?: string | null;
	ukuran?: number;
};

/**
 * Avatar foto profil (UX-3): tampilkan foto bila ada, inisial bila tidak.
 * Unduhan memakai header Bearer (rute files menolak anonim); gagal muat
 * otomatis jatuh ke inisial — juga di web (header tak didukung Image web).
 */
export function AvatarFoto({ nama, inisial, fotoPath, ukuran = 56 }: Props) {
	const [token, setToken] = useState<string | null>(null);
	const [gagal, setGagal] = useState(false);

	useEffect(() => {
		if (fotoPath) void tokenStore.get().then(setToken);
	}, [fotoPath]);

	if (!fotoPath || gagal || !token) {
		return (
			<View
				style={[styles.lingkar, { width: ukuran, height: ukuran, borderRadius: ukuran / 2 }]}
				accessibilityRole="image"
				accessibilityLabel={`Foto ${nama}`}
			>
				<Text style={[styles.teks, { fontSize: ukuran * 0.36 }]}>{inisial}</Text>
			</View>
		);
	}

	return (
		<Image
			source={{
				uri: apiUrl(`/api/files/${fotoPath}`),
				headers: { Authorization: `Bearer ${token}` },
			}}
			onError={() => setGagal(true)}
			style={{ width: ukuran, height: ukuran, borderRadius: ukuran / 2 }}
			accessibilityLabel={`Foto ${nama}`}
		/>
	);
}

const styles = StyleSheet.create({
	lingkar: {
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	teks: { fontWeight: "800", color: colors.textInverse },
});
