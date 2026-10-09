import { Platform } from "react-native";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";

/**
 * Identitas perangkat untuk audit presensi (PRD mobile Bag. 7-B5).
 * `deviceId` dibuat sekali per instalasi dan disimpan di secure store
 * sehingga tetap sama antar-app session.
 */

const DEVICE_ID_KEY = "hris.device_id";

const canUseSecureStore = Platform.OS !== "web";
let memoryDeviceId: string | null = null;
let pendingDeviceId: Promise<string> | null = null;
let cached: PerangkatInfo | null = null;

export type PerangkatInfo = {
	deviceId: string;
	deviceName: string;
	/** `ANDROID` | `IOS` | `WEB` — nilai yang dikirim ke server. */
	platform: string;
};

function uuidV4(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
		const digit = (Math.random() * 16) | 0;
		const value = char === "x" ? digit : (digit & 0x3) | 0x8;
		return value.toString(16);
	});
}

async function bacaDeviceId(): Promise<string> {
	if (!canUseSecureStore) {
		if (!memoryDeviceId) memoryDeviceId = uuidV4();
		return memoryDeviceId;
	}
	try {
		// Satu promise untuk semua pemanggilan paralel — cegah dua deviceId tercipta
		// saat registrasi push berjalan bersamaan (baca+ tulis SecureStore beruntun).
		if (!pendingDeviceId) {
			pendingDeviceId = (async () => {
				const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
				if (existing) return existing;
				const created = uuidV4();
				await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
				return created;
			})();
		}
		return await pendingDeviceId;
	} catch {
		// SecureStore bermasalah — pakai id sesi agar presensi tetap tercatat.
		if (!memoryDeviceId) memoryDeviceId = uuidV4();
		return memoryDeviceId;
	}
}

function namaPerangkat(): string {
	const kandidat = [Device.deviceName, Device.modelName, Device.productName].find(
		(value) => typeof value === "string" && value.trim() !== "",
	);
	if (kandidat) return kandidat;

	const merek = Device.brand ?? Device.manufacturer;
	if (merek) return `${merek} ${Device.osName ?? ""}`.trim();
	return "Perangkat";
}

/** Ambil identitas perangkat (hasil di-cache sepanjang app session). */
export async function ambilPerangkatInfo(): Promise<PerangkatInfo> {
	if (cached) return cached;
	cached = {
		deviceId: await bacaDeviceId(),
		deviceName: namaPerangkat(),
		platform: Platform.OS.toUpperCase(),
	};
	return cached;
}
