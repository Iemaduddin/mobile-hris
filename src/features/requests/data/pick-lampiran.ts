import * as ImagePicker from "expo-image-picker";
import type { BerkasPilihan } from "./requests-api";

/** Batas ukuran lampiran mengikuti aturan server `ownerType: "pengajuan"`. */
const MAKS_BYTE = 10 * 1024 * 1024;

export type HasilPilihLampiran =
	| { status: "dipilih"; berkas: BerkasPilihan }
	| { status: "batal" }
	| { status: "izin_ditolak" }
	| { status: "kebesaran" };

function dariAset(aset: ImagePicker.ImagePickerAsset): HasilPilihLampiran {
	if (aset.fileSize != null && aset.fileSize > MAKS_BYTE) return { status: "kebesaran" };
	return {
		status: "dipilih",
		berkas: {
			uri: aset.uri,
			name: aset.fileName ?? `lampiran-${Date.now().toString(36)}.jpg`,
			type: aset.mimeType ?? "image/jpeg",
		},
	};
}

/**
 * Ambil lampiran lewat kamera (PRD mobile Bag. 5.4: "kamera/galeri").
 * PDF tidak dilayani picker ini (Expo ImagePicker hanya media) — cukup untuk
 * jenis ketidakhadiran bertanda `wajibLampiran` pada UAT.
 */
export async function ambilFotoLampiran(): Promise<HasilPilihLampiran> {
	const izin = await ImagePicker.requestCameraPermissionsAsync();
	if (!izin.granted) return { status: "izin_ditolak" };

	const hasil = await ImagePicker.launchCameraAsync({ quality: 0.8 });
	if (hasil.canceled || hasil.assets.length === 0) return { status: "batal" };
	return dariAset(hasil.assets[0]);
}

/** Pilih satu gambar dari galeri sebagai lampiran pengajuan. */
export async function pilihLampiran(): Promise<HasilPilihLampiran> {
	const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (!izin.granted) return { status: "izin_ditolak" };

	const hasil = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ["images"],
		allowsMultipleSelection: false,
		quality: 0.8,
	});

	if (hasil.canceled || hasil.assets.length === 0) return { status: "batal" };
	return dariAset(hasil.assets[0]);
}
