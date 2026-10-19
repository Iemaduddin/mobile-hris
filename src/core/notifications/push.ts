import { useEffect } from "react";
import Constants from "expo-constants";
import { router, type Href } from "expo-router";
import { Platform } from "react-native";
import { getDeviceInfo } from "@/core/device/device-info";
import { api } from "@/core/network/api-client";

type NotificationsModule = typeof import("expo-notifications");
type NativeTokenEvent = { data: string };
type NotificationResponseEvent = { actionIdentifier: string; notification: { request: { identifier: string } } };

/**
 * Push notification (mobile PRD Bag. 5.8, stage M4).
 * - Ask permission → grab the `ExpoPushToken` → register via `POST /api/v1/devices`.
 * - Notification tap → deep link to the related screen (expo-router).
 * - Rotating token → automatic re-registration.
 *
 * All best-effort: the module loads lazily and any failure
 * (Expo Go, mismatched native module, no permission/projectId) yields
 * null — the app keeps running (in-app refresh fallback). Static imports
 * are avoided because `expo-notifications` requires its native module
 * at import time, which explodes on old runtimes.
 */

const CHANNEL_ID = "default";

let moduleCache: Promise<NotificationsModule | null> | null = null;

/** Load expo-notifications once; null when the runtime lacks support. */
function loadNotifications(): Promise<NotificationsModule | null> {
	if (!moduleCache) {
		moduleCache = import("expo-notifications").catch(() => null);
	}
	return moduleCache;
}

/** true when push is supported (dev build / production, not Expo Go / web). */
function isPushSupported(): boolean {
	return Platform.OS !== "web" && Constants.appOwnership !== "expo";
}

/**
 * Last native token that already triggered a re-registration.
 * `getExpoPushTokenAsync()` fires a token event on every call — without
 * this dedupe, listener → registerPushToken → event → listener loops
 * forever (hundreds of POST /devices).
 */
let lastFcmToken: string | null = null;
let registering: Promise<string | null> | null = null;

// Show incoming notifications while the app is open (foreground).
let handlerInstalled = false;

async function installHandler(): Promise<void> {
	if (handlerInstalled) return;
	handlerInstalled = true;
	try {
		const Notifications = await loadNotifications();
		await Notifications?.setNotificationHandler({
			handleNotification: async () => ({
				shouldPlaySound: true,
				shouldSetBadge: true,
				shouldShowBanner: true,
				shouldShowList: true,
			}),
		});
	} catch {
		// Runtime unsupported — ignore, in-app refresh fallback.
	}
}

async function createAndroidChannel(Notifications: NotificationsModule): Promise<void> {
	if (Platform.OS !== "android") return;
	// Android 13+: the permission prompt only appears after a notification channel exists.
	await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
		name: "Notification HRIS",
		importance: Notifications.AndroidImportance.HIGH,
		vibrationPattern: [0, 250, 250, 250],
		lightColor: "#208AEF",
	});
}

function getProjectId(): string | null {
	return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

async function registerTokenWithServer(token: string): Promise<void> {
	const device = await getDeviceInfo();
	await api.post("/api/v1/devices", {
		deviceId: device.deviceId,
		deviceName: device.deviceName,
		platform: device.platform,
		pushToken: token,
	});
}

/**
 * Ask notification permission, grab the ExpoPushToken, send it to the server.
 * Returns the token on success, null otherwise (always best-effort).
 */
export async function registerPushToken(): Promise<string | null> {
	// Push is unavailable in Expo Go (SDK 53+) — don't nag with a permission prompt.
	if (!isPushSupported()) return null;

	// One registration at a time (parallel calls from effect + listener).
	if (registering) return registering;

	registering = (async () => {
		try {
			const Notifications = await loadNotifications();
			if (!Notifications) return null;
			await installHandler();
			await createAndroidChannel(Notifications);

			const permission = await Notifications.getPermissionsAsync();
			const status = permission.granted
				? permission.status
				: (await Notifications.requestPermissionsAsync()).status;
			if (status !== "granted") return null;

			const projectId = getProjectId();
			if (!projectId) return null;

			const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
			await registerTokenWithServer(token);
			return token;
		} catch (error) {
			// Message only (not an Error object) to avoid LogBox warnings.
			console.warn(
				"[push] Gagal mendaftarkan push token:",
				error instanceof Error ? error.message : String(error),
			);
			return null;
		}
	})().finally(() => {
		registering = null;
	});

	return registering;
}

/** Unregister the device on logout: revoke the pushToken & deactivate the device row. */
export async function unregisterPush(): Promise<void> {
	if (Platform.OS === "web") return;
	try {
		const device = await getDeviceInfo();
		await api.delete(`/api/v1/devices?deviceId=${encodeURIComponent(device.deviceId)}`);
	} catch {
		// best-effort — the server also drops expired tokens when pushes fail.
	}
}

// ============================================================
// Listeners: tap → deep link, foreground → in-app refresh
// ============================================================

/** Last response already navigated (prevents doubles on cold start). */
let lastResponseId: string | null = null;

function urlFromNotification(data: unknown): string | null {
	if (!data || typeof data !== "object") return null;
	const url = (data as Record<string, unknown>).url;
	return typeof url === "string" && url.startsWith("/") ? url : null;
}

async function openNotification(response: NotificationResponseEvent, Notifications: NotificationsModule): Promise<void> {
	if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
	const identifier = response.notification.request.identifier;
	if (identifier === lastResponseId) return;
	lastResponseId = identifier;

	const data = (
		response as unknown as {
			notification: { request: { content: { data?: unknown } } };
		}
	).notification.request.content.data;
	const url = urlFromNotification(data);
	if (url) router.push(url as Href);
}

type PushNotificationOptions = {
	/** Session status is `signedIn` — listeners attach once the root layout is ready. */
	ready: boolean;
	/** Foreground notification → refresh in-app data (fallback when push isn't ready). */
	onNotificationReceived?: () => void;
};

/**
 * Attach push notification listeners (mobile PRD Bag. 5.8):
 * - tap / cold start → deep link (`data.url`) to the related screen
 * - rotating token → re-register with the server
 * - foreground receipt → in-app refresh callback + clear badge
 */
export function usePushNotifications({ ready, onNotificationReceived }: PushNotificationOptions): void {
	useEffect(() => {
		if (!ready || !isPushSupported()) return;

		let tap: { remove: () => void } | null = null;
		let received: { remove: () => void } | null = null;
		let tokenRefresh: { remove: () => void } | null = null;
		let cancelled = false;

		void (async () => {
			try {
				const Notifications = await loadNotifications();
				if (!Notifications || cancelled) return;
				await installHandler();
				if (cancelled) return;

				tap = Notifications.addNotificationResponseReceivedListener((response) => {
					void openNotification(
						response as unknown as NotificationResponseEvent,
						Notifications,
					);
				});
				received = Notifications.addNotificationReceivedListener(() => {
					onNotificationReceived?.();
				});
				tokenRefresh = Notifications.addPushTokenListener((event: NativeTokenEvent) => {
					// The event carries the native (FCM) token, not the ExpoPushToken the server uses.
					// Ignore repeats of the last token — prevents re-registration loops.
					if (event.data === lastFcmToken) return;
					lastFcmToken = event.data;
					// Full re-registration → swap back to an ExpoPushToken before sending to the API.
					void registerPushToken();
				});

				// Cold start from a notification tap → navigate + clear so it never repeats.
				const cold = await Notifications.getLastNotificationResponseAsync();
				if (cold && !cancelled) {
					await openNotification(cold as unknown as NotificationResponseEvent, Notifications);
					await Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
				}
				if (!cancelled) {
					await Notifications.setBadgeCountAsync(0).catch(() => undefined);
				}
			} catch {
				// Native module unavailable — ignore, in-app refresh fallback.
			}
		})();

		return () => {
			cancelled = true;
			tap?.remove();
			received?.remove();
			tokenRefresh?.remove();
		};
	}, [ready, onNotificationReceived]);
}
