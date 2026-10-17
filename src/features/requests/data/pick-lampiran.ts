import * as ImagePicker from "expo-image-picker";
import type { PickedFile } from "./requests-api";

/** Size cap mirrors the server rule for `ownerType: "pengajuan"`. */
const MAX_BYTES = 10 * 1024 * 1024;

export type AttachmentPickResult =
	| { status: "picked"; file: PickedFile }
	| { status: "cancelled" }
	| { status: "permission_denied" }
	| { status: "too_large" };

function fromAsset(asset: ImagePicker.ImagePickerAsset): AttachmentPickResult {
	if (asset.fileSize != null && asset.fileSize > MAX_BYTES) return { status: "too_large" };
	return {
		status: "picked",
		file: {
			uri: asset.uri,
			name: asset.fileName ?? `lampiran-${Date.now().toString(36)}.jpg`,
			type: asset.mimeType ?? "image/jpeg",
		},
	};
}

/**
 * Capture an attachment with the camera (mobile PRD Bag. 5.4: "kamera/galeri").
 * PDFs are not served by this picker (Expo ImagePicker is media-only) — enough for
 * absence kinds flagged `requiresAttachment` in UAT.
 */
export async function captureAttachmentPhoto(): Promise<AttachmentPickResult> {
	const permission = await ImagePicker.requestCameraPermissionsAsync();
	if (!permission.granted) return { status: "permission_denied" };

	const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
	if (result.canceled || result.assets.length === 0) return { status: "cancelled" };
	return fromAsset(result.assets[0]);
}

/** Pick one image from the gallery as a request attachment. */
export async function pickAttachmentImage(): Promise<AttachmentPickResult> {
	const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (!permission.granted) return { status: "permission_denied" };

	const result = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ["images"],
		allowsMultipleSelection: false,
		quality: 0.8,
	});

	if (result.canceled || result.assets.length === 0) return { status: "cancelled" };
	return fromAsset(result.assets[0]);
}
