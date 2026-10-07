/**
 * Konfigurasi aplikasi. Base URL diambil dari environment
 * dengan prefix EXPO_PUBLIC_ agar ter-inject saat build.
 */

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!rawBaseUrl) {
	console.warn("[app-config] EXPO_PUBLIC_API_URL belum di-set. Cek file .env");
}

export const appConfig = {
	apiUrl: (rawBaseUrl ?? "http://localhost:3000").replace(/\/+$/, ""),
	isDev: process.env.NODE_ENV !== "production",
} as const;

/** Gabung base URL dengan path endpoint, contoh: apiUrl("/api/v1/attendance") */
export function apiUrl(path: string): string {
	return `${appConfig.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
