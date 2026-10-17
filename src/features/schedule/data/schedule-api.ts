import { api } from "@/core/network/api-client";
import type { MySchedule } from "../models/schedule";

/**
 * Owned shift roster + calendar assignments.
 * Backend default: next 7 days when no range is sent.
 */
export function getSchedule(start?: string, end?: string, signal?: AbortSignal): Promise<MySchedule> {
	const params = new URLSearchParams();
	if (start) params.set("start", start);
	if (end) params.set("end", end);
	const query = params.size > 0 ? `?${params.toString()}` : "";
	return api.get<MySchedule>(`/api/v1/schedule${query}`, { signal });
}
