/**
 * Utilitas geolokasi klien — cerminan dari `hris/src/modules/attendance/lib/geo.ts`.
 * Dipakai untuk pratinjau jarak sebelum presensi dikirim (PRD mobile Bag. 5.4);
 * keputusan final tetap dihitung server.
 */

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

/** Distance between two coordinates in meters (Haversine formula). */
export function measureDistanceMeters(
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

export type SitePoint = {
	latitude: number | null;
	longitude: number | null;
	radiusMeters: number | null;
};

/**
 * @returns `true` = outside the radius, `false` = inside the radius,
 *          `null` = cannot judge (no coordinates/no radius).
 */
export function validateRadius(
	position: { latitude: number | null; longitude: number | null },
	site: SitePoint | null | undefined,
): boolean | null {
	if (!site) return null;
	if (site.latitude == null || site.longitude == null) return null;
	if (site.radiusMeters == null || site.radiusMeters <= 0) return null;
	if (position.latitude == null || position.longitude == null) return null;
	if (!Number.isFinite(position.latitude) || !Number.isFinite(position.longitude)) return null;

	const distance = measureDistanceMeters(
		position.latitude,
		position.longitude,
		site.latitude,
		site.longitude,
	);
	return distance > site.radiusMeters;
}
