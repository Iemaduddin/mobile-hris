import * as Location from "expo-location";

/**
 * Akses lokasi perangkat (PRD mobile Bag. 5.3.A).
 * Hanya lokasi foreground — PRD Bag. 3: tanpa pelacakan latar belakang.
 */

/** Berapa lama menunggu fix GPS sebelum dianggap gagal. */
const TIMEOUT_MS = 15_000;

export type PosisiPerangkat = {
	latitude: number;
	longitude: number;
	akurasiMeter: number | null;
	/** `true` bila sistem melaporkan lokasi simulasi (Android; iOS selalu `false`). */
	isMocked: boolean;
	timestamp: number;
};

export type GagalAmbilPosisi =
	| "LAYANAN_NONAKTIF"
	| "IZIN_DITOLAK"
	| "TIDAK_TERSEDIA";

export type HasilPosisi =
	| { ok: true; posisi: PosisiPerangkat }
	| { ok: false; reason: GagalAmbilPosisi };

export type StatusIzin = {
	diizinkan: boolean;
	/** `false` = pengguna menolak permanen → arahkan ke Pengaturan. */
	bisaTanyaLagi: boolean;
};

/** Minta (atau sekadar cek) izin lokasi foreground. */
export async function mintaIzinLokasi(request = true): Promise<StatusIzin> {
	try {
		const response = request
			? await Location.requestForegroundPermissionsAsync()
			: await Location.getForegroundPermissionsAsync();

		return {
			diizinkan: response.granted,
			bisaTanyaLagi: response.canAskAgain,
		};
	} catch {
		return { diizinkan: false, bisaTanyaLagi: false };
	}
}

function toPosisi(location: Location.LocationObject): PosisiPerangkat {
	return {
		latitude: location.coords.latitude,
		longitude: location.coords.longitude,
		akurasiMeter: location.coords.accuracy ?? null,
		// PRD Bag. 10: deteksi mock hanya andalkan Android (`mocked` tidak ada di iOS).
		isMocked: location.mocked === true,
		timestamp: location.timestamp,
	};
}

/** Penanda timeout — bukan Error agar tak memicu warning LogBox. */
const BATAS_WAKTU = Symbol("BATAS_WAKTU");

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(BATAS_WAKTU), ms);
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
 * Ambil koordinat terkini sekali pakai.
 * Presensi tetap boleh dikirim tanpa GPS (PRD Bag. 5.3.A) — pemanggil
 * cukup menangani `ok: false` sebagai "tanpa koordinat".
 */
export async function ambilPosisi(): Promise<HasilPosisi> {
	try {
		const servicesEnabled = await Location.hasServicesEnabledAsync();
		if (!servicesEnabled) return { ok: false, reason: "LAYANAN_NONAKTIF" };

		const izin = await mintaIzinLokasi(true);
		if (!izin.diizinkan) return { ok: false, reason: "IZIN_DITOLAK" };

		const location = await withTimeout(
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
			TIMEOUT_MS,
		);

		return { ok: true, posisi: toPosisi(location) };
	} catch (error) {
		if (error === BATAS_WAKTU) {
			return { ok: false, reason: "TIDAK_TERSEDIA" };
		}
		return { ok: false, reason: "TIDAK_TERSEDIA" };
	}
}

/** Pesan peringatan untuk ditampilkan ke pengguna. */
export function pesanGagalPosisi(reason: GagalAmbilPosisi): string {
	switch (reason) {
		case "LAYANAN_NONAKTIF":
			return "Layanan lokasi perangkat sedang nonaktif. Nyalakan GPS lalu coba lagi.";
		case "IZIN_DITOLAK":
			return "Izin lokasi ditolak. Aktifkan izin lokasi agar presensi dapat menyertakan koordinat.";
		case "TIDAK_TERSEDIA":
			return "Lokasi belum berhasil didapatkan. Presensi tetap dapat dikirim tanpa koordinat.";
	}
}
