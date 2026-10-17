import { api } from "@/core/network/api-client";
import type { Profile } from "../models/profile";

/** Owned full profile — mobile PRD Bag. 5.6 / Bag. 6 no.4 (B6). */
export function getMyProfile(signal?: AbortSignal): Promise<{ profile: Profile }> {
	return api.get<{ profile: Profile }>("/api/v1/me/profile", { signal });
}
