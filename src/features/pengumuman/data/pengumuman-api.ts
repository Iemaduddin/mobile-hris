import { api } from "@/core/network/api-client";

/** Company announcements + this week's events (birthdays/anniversaries). */

export type CompanyAnnouncement = {
	id: string;
	title: string;
	body: string;
	unitName: string | null;
	startsAt: string;
	endsAt: string | null;
};

export type UpcomingEvent = {
	fullName: string;
	employeeNumber: string;
	kind: "ULTAH" | "ANNIV";
	date: string;
	info: string;
};

export type AnnouncementResponse = { items: CompanyAnnouncement[]; events: UpcomingEvent[] };

export function getAnnouncements(signal?: AbortSignal): Promise<AnnouncementResponse> {
	return api.get<AnnouncementResponse>("/api/v1/pengumuman", { signal });
}

export type PublishAnnouncementInput = { title: string; body: string };
export type PublishAnnouncementResult = { id: string; message: string };

/** Terbitkan pengumuman teks (HR/admin) — langsung tayang. */
export function publishAnnouncement(input: PublishAnnouncementInput): Promise<PublishAnnouncementResult> {
	return api.post<PublishAnnouncementResult>("/api/v1/pengumuman", input);
}
