import { api } from "@/core/network/api-client";
import { tokenStore } from "@/core/storage/token-store";
import type { Profile } from "../models/profile";

/** Owned full profile — mobile PRD Bag. 5.6 / Bag. 6 no.4 (B6). */
export function getMyProfile(signal?: AbortSignal): Promise<{ profile: Profile }> {
	return api.get<{ profile: Profile }>("/api/v1/me/profile", { signal });
}

/**
 * P6-5 — ganti kata sandi dari aplikasi.
 * Server mencabut sesi lain, jadi sesi perangkat ini diganti token baru:
 * token baru disimpan sebelum layar menganggap perubahan berhasil.
 */
export async function changePassword(input: {
	currentPassword: string;
	newPassword: string;
}): Promise<{ message: string }> {
	const result = await api.post<{ message: string; token: string | null }>(
		"/api/v1/me/password",
		input,
	);
	if (result.token) await tokenStore.set(result.token);
	return { message: result.message };
}
