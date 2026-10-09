/**
 * Utilitas geolokasi klien — cerminan dari `hris/src/modules/attendance/lib/geo.ts`.
 * Dipakai untuk pratinjau jarak sebelum presensi dikirim (PRD mobile Bag. 5.4);
 * keputusan final tetap dihitung server.
 */

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

/** Jarak antara dua koordinat dalam meter (rumus Haversine). */
export function hitungJarakMeter(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

	return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type TitikLokasi = {
	latitude: number | null;
	longitude: number | null;
	radiusMeter: number | null;
};

/**
 * @returns `true` = di luar radius, `false` = di dalam radius,
 *          `null` = tidak dapat dinilai (tanpa koordinat/tanpa radius).
 */
export function validasiRadius(
	posisi: { latitude: number | null; longitude: number | null },
	lokasi: TitikLokasi | null | undefined,
): boolean | null {
	if (!lokasi) return null;
	if (lokasi.latitude == null || lokasi.longitude == null) return null;
	if (lokasi.radiusMeter == null || lokasi.radiusMeter <= 0) return null;
	if (posisi.latitude == null || posisi.longitude == null) return null;
	if (!Number.isFinite(posisi.latitude) || !Number.isFinite(posisi.longitude)) return null;

	const jarak = hitungJarakMeter(
		posisi.latitude,
		posisi.longitude,
		lokasi.latitude,
		lokasi.longitude,
	);
	return jarak > lokasi.radiusMeter;
}
