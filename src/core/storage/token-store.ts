import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Penyimpanan session token.
 * PRD Bag. 8: token tidak boleh di log dan tidak boleh di penyimpanan biasa.
 * `expo-secure-store` memakai Keychain/Keystore — bukan AsyncStorage.
 *
 * Catatan: SecureStore tidak tersedia di web, jadi dev via `expo start --web`
 * memakai memori sementara (token hilang saat reload — cukup untuk dev).
 */

const TOKEN_KEY = "hris.session_token";

let memoryToken: string | null = null;

const canUseSecureStore = Platform.OS !== "web";

export const tokenStore = {
	async get(): Promise<string | null> {
		if (!canUseSecureStore) return memoryToken;
		try {
			return await SecureStore.getItemAsync(TOKEN_KEY);
		} catch {
			return null;
		}
	},

	async set(token: string): Promise<void> {
		if (!canUseSecureStore) {
			memoryToken = token;
			return;
		}
		await SecureStore.setItemAsync(TOKEN_KEY, token);
	},

	async clear(): Promise<void> {
		if (!canUseSecureStore) {
			memoryToken = null;
			return;
		}
		await SecureStore.deleteItemAsync(TOKEN_KEY);
	},
};
