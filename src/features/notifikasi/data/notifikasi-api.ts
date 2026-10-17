import { api } from "@/core/network/api-client";

/** Mobile in-app notifications — P4-3 (endpoint exists, new screen). */

export type MobileNotification = {
	id: string;
	title: string;
	body: string;
	kind: string;
	referenceType: string | null;
	referenceId: string | null;
	url: string | null;
	isRead: boolean;
	time: string;
};

export type MobilePreferences = { pushEnabled: boolean; emailEnabled: boolean };

export type NotificationResponse = {
	unreadCount: number;
	preferences: MobilePreferences;
	items: MobileNotification[];
};

export function getNotifications(unreadOnly = false, signal?: AbortSignal): Promise<NotificationResponse> {
	const qs = unreadOnly ? "?unread=1" : "";
	return api.get<NotificationResponse>(`/api/v1/notifications${qs}`, { signal });
}

export function markAsRead(id: string): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/notifications", { id });
}

export function savePreferences(input: MobilePreferences): Promise<{ message: string }> {
	return api.post<{ message: string }>("/api/v1/notifications", input);
}

/** Map the server web deep-link to a mobile route. */
export function mobileRoute(item: Pick<MobileNotification, "url" | "referenceType" | "referenceId">): string | null {
	if (item.url === "/approval") return "/approval";
	if (item.referenceType === "CUTI" && item.referenceId)
		return `/requests/detail?id=${encodeURIComponent(item.referenceId)}&kind=leave`;
	if (item.referenceType === "LEMBUR" && item.referenceId)
		return `/requests/detail?id=${encodeURIComponent(item.referenceId)}&kind=overtime`;
	if (item.referenceType === "DINAS" && item.referenceId)
		return `/requests/detail?id=${encodeURIComponent(item.referenceId)}&kind=duty`;
	return null;
}
