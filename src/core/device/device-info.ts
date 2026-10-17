import { Platform } from "react-native";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";

/**
 * Device identity for attendance audits (mobile PRD Bag. 7-B5).
 * `deviceId` is created once per install and kept in the secure store
 * so it stays stable across app sessions.
 */

const DEVICE_ID_KEY = "hris.device_id";

const canUseSecureStore = Platform.OS !== "web";
let memoryDeviceId: string | null = null;
let pendingDeviceId: Promise<string> | null = null;
let cached: DeviceInfo | null = null;

export type DeviceInfo = {
	deviceId: string;
	deviceName: string;
	/** `ANDROID` | `IOS` | `WEB` — value sent to the server. */
	platform: string;
};

function uuidV4(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
		const digit = (Math.random() * 16) | 0;
		const value = char === "x" ? digit : (digit & 0x3) | 0x8;
		return value.toString(16);
	});
}

async function readDeviceId(): Promise<string> {
	if (!canUseSecureStore) {
		if (!memoryDeviceId) memoryDeviceId = uuidV4();
		return memoryDeviceId;
	}
	try {
		// One promise for parallel callers — prevents two deviceIds when push
		// registration races (sequential SecureStore read + write).
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
		// SecureStore broken — fall back to a session id so attendance still records.
		if (!memoryDeviceId) memoryDeviceId = uuidV4();
		return memoryDeviceId;
	}
}

function resolveDeviceName(): string {
	const candidate = [Device.deviceName, Device.modelName, Device.productName].find(
		(value) => typeof value === "string" && value.trim() !== "",
	);
	if (candidate) return candidate;

	const brand = Device.brand ?? Device.manufacturer;
	if (brand) return `${brand} ${Device.osName ?? ""}`.trim();
	return "Perangkat";
}

/** Read the device identity (cached for the app session). */
export async function getDeviceInfo(): Promise<DeviceInfo> {
	if (cached) return cached;
	cached = {
		deviceId: await readDeviceId(),
		deviceName: resolveDeviceName(),
		platform: Platform.OS.toUpperCase(),
	};
	return cached;
}
