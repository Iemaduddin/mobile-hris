import { api } from "@/core/network/api-client";

/** Tim saya hari ini + direktori bawahan (non-sensitif) — manajer/HR. */

export type TeamTodayMember = {
	employeeId: string;
	name: string;
	employeeNumber: string;
	status: string;
	shift: string | null;
	info: string | null;
	phone: string | null;
	email: string | null;
	positionName: string | null;
	unitName: string | null;
};

export type TeamResponse = {
	date: string;
	count: number;
	onLeave: TeamTodayMember[];
	members: TeamTodayMember[];
};

export function getTeam(signal?: AbortSignal): Promise<TeamResponse> {
	return api.get<TeamResponse>("/api/v1/team", { signal });
}
