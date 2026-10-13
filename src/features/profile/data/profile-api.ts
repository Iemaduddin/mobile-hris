import { api } from "@/core/network/api-client";
import type { Profil } from "../models/profile";

/** Profil lengkap milik sendiri — PRD mobile Bag. 5.6 / Bag. 6 no.4 (B6). */
export function getProfil(signal?: AbortSignal): Promise<{ profil: Profil }> {
	return api.get<{ profil: Profil }>("/api/v1/me/profile", { signal });
}
