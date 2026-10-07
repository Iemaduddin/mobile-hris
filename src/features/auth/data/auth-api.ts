import { api } from "@/core/network/api-client";
import type { LoginResponse, MeResponse } from "../models/session";

/**
 * Endpoint autentikasi mobile — PRD mobile Bag. 6 no.1-3.
 * Login mengembalikan session token yang disimpan di secure store,
 * lalu dipakai sebagai `Authorization: Bearer` di request berikutnya.
 */

export async function login(email: string, password: string): Promise<LoginResponse> {
	return api.post<LoginResponse>("/api/v1/auth/login", { email, password }, { skipAuth: true });
}

export async function logout(): Promise<void> {
	await api.post("/api/v1/auth/logout");
}

export function getMe(): Promise<MeResponse> {
	return api.get<MeResponse>("/api/v1/me");
}
