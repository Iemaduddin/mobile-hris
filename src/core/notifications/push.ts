import { useEffect } from "react";
import Constants from "expo-constants";
import { router, type Href } from "expo-router";
import { Platform } from "react-native";
import { ambilPerangkatInfo } from "@/core/device/device-info";
import { api } from "@/core/network/api-client";

type ModulNotifikasi = typeof import("expo-notifications");
type ModEventToken = { data: string };
type ModResponse = { actionIdentifier: string; notification: { request: { identifier: string } } };

/**
 * Push notification (PRD mobile Bag. 5.8, tahap M4).
 * - Minta izin → ambil `ExpoPushToken` → daftarkan ke `POST /api/v1/devices`.
 * - Tap notifikasi → deep link ke layar terkait (expo-router).
 * - Token berputar → daftar ulang otomatis.
 *
 * Semua bersifat best-effort: modul dimuat malas dan kegagalan apa pun
 * (Expo Go, native module tak cocok, tanpa izin/projectId) menghasilkan
 * null — aplikasi tetap jalan (fallback refresh in-app). Impor statis
 * dihindari karena `expo-notifications` baru me-require native module
 * topik saat diimpor, yang meledak di runtime lama.
 */

const CHANNEL_ID = "default";

let modulCache: Promise<ModulNotifikasi | null> | null = null;

/** Muat expo-notifications sekali; null bila runtime tak mendukung. */
function muatNotifikasi(): Promise<ModulNotifikasi | null> {
	if (!modulCache) {
		modulCache = import("expo-notifications").catch(() => null);
	}
	return modulCache;
}

/** true bila push didukung (dev build / production, bukan Expo Go / web). */
function pushDidukung(): boolean {
	return Platform.OS !== "web" && Constants.appOwnership !== "expo";
}

/**
 * Token native terakhir yang sudah memicu pendaftaran ulang.
 * `getExpoPushTokenAsync()` memicu event token setiap dipanggil — tanpa
 * dedupe ini, listener → daftarkanPushToken → event → listener jadi loop
 * tak berujung (ratusan POST /devices).
 */
let fcmTerakhir: string | null = null;
let sedangDaftar: Promise<string | null> | null = null;

// Tampilkan notifikasi yang masuk selama aplikasi terbuka (foreground).
let handlerTerpasang = false;

async function pasangHandler(): Promise<void> {
	if (handlerTerpasang) return;
	handlerTerpasang = true;
	try {
		const Notifications = await muatNotifikasi();
		await Notifications?.setNotificationHandler({
			handleNotification: async () => ({
				shouldPlaySound: true,
				shouldSetBadge: true,
				shouldShowBanner: true,
				shouldShowList: true,
			}),
		});
	} catch {
		// Runtime tak mendukung — abaikan, fallback refresh in-app.
	}
}

async function buatChannelAndroid(Notifications: ModulNotifikasi): Promise<void> {
	if (Platform.OS !== "android") return;
	// Android 13+: prompt izin baru muncul setelah ada notification channel.
	await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
		name: "Notifikasi HRIS",
		importance: Notifications.AndroidImportance.HIGH,
		vibrationPattern: [0, 250, 250, 250],
		lightColor: "#208AEF",
	});
}

function ambilProjectId(): string | null {
	return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

async function daftarkanTokenKeServer(token: string): Promise<void> {
	const perangkat = await ambilPerangkatInfo();
	await api.post("/api/v1/devices", {
		deviceId: perangkat.deviceId,
		deviceName: perangkat.deviceName,
		platform: perangkat.platform,
		pushToken: token,
	});
}

/**
 * Minta izin notifikasi, ambil ExpoPushToken, kirim ke server.
 * Mengembalikan token bila berhasil, null bila tidak (selalu best-effort).
 */
export async function daftarkanPushToken(): Promise<string | null> {
	// Push tidak tersedia di Expo Go (SDK 53+) — jangan ganggu dengan prompt izin.
	if (!pushDidukung()) return null;

	// Satu pendaftaran pada satu waktu (panggilan paralel dari effect + listener).
	if (sedangDaftar) return sedangDaftar;

	sedangDaftar = (async () => {
		try {
			const Notifications = await muatNotifikasi();
			if (!Notifications) return null;
			await pasangHandler();
			await buatChannelAndroid(Notifications);

			const izin = await Notifications.getPermissionsAsync();
			const status = izin.granted
				? izin.status
				: (await Notifications.requestPermissionsAsync()).status;
			if (status !== "granted") return null;

			const projectId = ambilProjectId();
			if (!projectId) return null;

			const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
			await daftarkanTokenKeServer(token);
			return token;
		} catch (error) {
			// Pesan saja (bukan objek Error) agar tak jadi warning LogBox.
			console.warn(
				"[push] Gagal mendaftarkan push token:",
				error instanceof Error ? error.message : String(error),
			);
			return null;
		}
	})().finally(() => {
		sedangDaftar = null;
	});

	return sedangDaftar;
}

/** Unregister perangkat saat logout: cabut pushToken & nonaktifkan baris device. */
export async function batalDaftarPush(): Promise<void> {
	if (Platform.OS === "web") return;
	try {
		const perangkat = await ambilPerangkatInfo();
		await api.delete(`/api/v1/devices?deviceId=${encodeURIComponent(perangkat.deviceId)}`);
	} catch {
		// best-effort — server juga membuang token yang kedaluwarsa saat push gagal.
	}
}

// ============================================================
// Listener: tap → deep link, foreground → refresh in-app
// ============================================================

/** Penanda respons terakhir yang sudah dinavigasi (cegah dobel saat cold start). */
let responsTerakhir: string | null = null;

function urlDariNotifikasi(data: unknown): string | null {
	if (!data || typeof data !== "object") return null;
	const url = (data as Record<string, unknown>).url;
	return typeof url === "string" && url.startsWith("/") ? url : null;
}

async function bukaNotifikasi(response: ModResponse, Notifications: ModulNotifikasi): Promise<void> {
	if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
	const identifier = response.notification.request.identifier;
	if (identifier === responsTerakhir) return;
	responsTerakhir = identifier;

	const data = (
		response as unknown as {
			notification: { request: { content: { data?: unknown } } };
		}
	).notification.request.content.data;
	const url = urlDariNotifikasi(data);
	if (url) router.push(url as Href);
}

type PilihanPushNotifikasi = {
	/** Status sesi sudah `signedIn` — listener baru dipasang setelah root layout siap. */
	siap: boolean;
	/** Notifikasi diterima di foreground → segarkan data in-app (fallback bila push belum siap). */
	onNotifikasiDiterima?: () => void;
};

/**
 * Pasang listener push notification (PRD mobile Bag. 5.8):
 * - tap / cold start → deep link (`data.url`) ke layar terkait
 * - token berputar → daftar ulang ke server
 * - diterima di foreground → callback refresh in-app + bersihkan badge
 */
export function usePushNotifikasi({ siap, onNotifikasiDiterima }: PilihanPushNotifikasi): void {
	useEffect(() => {
		if (!siap || !pushDidukung()) return;

		let tap: { remove: () => void } | null = null;
		let diterima: { remove: () => void } | null = null;
		let putarToken: { remove: () => void } | null = null;
		let batal = false;

		void (async () => {
			try {
				const Notifications = await muatNotifikasi();
				if (!Notifications || batal) return;
				await pasangHandler();
				if (batal) return;

				tap = Notifications.addNotificationResponseReceivedListener((response) => {
					void bukaNotifikasi(
						response as unknown as ModResponse,
						Notifications,
					);
				});
				diterima = Notifications.addNotificationReceivedListener(() => {
					onNotifikasiDiterima?.();
				});
				putarToken = Notifications.addPushTokenListener((event: ModEventToken) => {
					// Event berisi token native (FCM), bukan ExpoPushToken yang dipakai server.
					// Abaikan bila token sama dengan terakhir — cegah loop pendaftaran ulang.
					if (event.data === fcmTerakhir) return;
					fcmTerakhir = event.data;
					// Daftar ulang penuh → tukar ulang ke ExpoPushToken sebelum kirim ke API.
					void daftarkanPushToken();
				});

				// Cold start dari tap notifikasi → navigasi + bersihkan agar tidak diulang.
				const cold = await Notifications.getLastNotificationResponseAsync();
				if (cold && !batal) {
					await bukaNotifikasi(cold as unknown as ModResponse, Notifications);
					await Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
				}
				if (!batal) {
					await Notifications.setBadgeCountAsync(0).catch(() => undefined);
				}
			} catch {
				// Native module tak tersedia — abaikan, fallback refresh in-app.
			}
		})();

		return () => {
			batal = true;
			tap?.remove();
			diterima?.remove();
			putarToken?.remove();
		};
	}, [siap, onNotifikasiDiterima]);
}
