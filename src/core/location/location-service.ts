import * as Location from "expo-location";

/**
 * Device location access (mobile PRD Bag. 5.3.A).
 * Foreground only — PRD Bag. 3: no background tracking.
 */

/** How long to wait for a GPS fix before giving up. */
const TIMEOUT_MS = 15_000;

export type DevicePosition = {
	latitude: number;
	longitude: number;
	accuracyMeters: number | null;
	/** `true` when the OS reports a mocked location (Android; always `false` on iOS). */
	isMocked: boolean;
	timestamp: number;
};

export type PositionFailure =
	| "SERVICE_OFF"
	| "PERMISSION_DENIED"
	| "UNAVAILABLE";

export type PositionResult =
	| { ok: true; position: DevicePosition }
	| { ok: false; reason: PositionFailure };

export type PermissionStatus = {
	granted: boolean;
	/** `false` = permanently denied by the user → point them at Settings. */
	canAskAgain: boolean;
};

/** Ask for (or just check) foreground location permission. */
export async function requestLocationPermission(request = true): Promise<PermissionStatus> {
	try {
		const response = request
			? await Location.requestForegroundPermissionsAsync()
			: await Location.getForegroundPermissionsAsync();

		return {
			granted: response.granted,
			canAskAgain: response.canAskAgain,
		};
	} catch {
		return { granted: false, canAskAgain: false };
	}
}

function toPosition(location: Location.LocationObject): DevicePosition {
	return {
		latitude: location.coords.latitude,
		longitude: location.coords.longitude,
		accuracyMeters: location.coords.accuracy ?? null,
		// PRD Bag. 10: mock detection relies on Android only (`mocked` is absent on iOS).
		isMocked: location.mocked === true,
		timestamp: location.timestamp,
	};
}

/** Timeout marker — not an Error, so it never triggers a LogBox warning. */
const TIMEOUT = Symbol("TIMEOUT");

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(TIMEOUT), ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}

/**
 * Take one fresh coordinate reading.
 * Attendance may still be sent without GPS (PRD Bag. 5.3.A) — callers
 * just treat `ok: false` as "no coordinates".
 */
export async function getPosition(): Promise<PositionResult> {
	try {
		const servicesEnabled = await Location.hasServicesEnabledAsync();
		if (!servicesEnabled) return { ok: false, reason: "SERVICE_OFF" };

		const permission = await requestLocationPermission(true);
		if (!permission.granted) return { ok: false, reason: "PERMISSION_DENIED" };

		const location = await withTimeout(
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
			TIMEOUT_MS,
		);

		return { ok: true, position: toPosition(location) };
	} catch (error) {
		if (error === TIMEOUT) {
			return { ok: false, reason: "UNAVAILABLE" };
		}
		return { ok: false, reason: "UNAVAILABLE" };
	}
}

/** Warning message to show the user. */
export function getPositionErrorMessage(reason: PositionFailure): string {
	switch (reason) {
		case "SERVICE_OFF":
			return "Layanan lokasi perangkat sedang nonaktif. Nyalakan GPS lalu coba lagi.";
		case "PERMISSION_DENIED":
			return "Izin lokasi ditolak. Aktifkan izin lokasi agar presensi dapat menyertakan koordinat.";
		case "UNAVAILABLE":
			return "Lokasi belum berhasil didapatkan. Presensi tetap dapat dikirim tanpa koordinat.";
	}
}
