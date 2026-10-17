import { api } from "@/core/network/api-client";
import type {
	AbsenceType,
	DutyRequest,
	LeaveBalance,
	LeaveRequest,
	OvertimeRequest,
	RequestAction,
	RequestActionResult,
} from "../models/request";

/**
 * Mobile request endpoints — mobile PRD Bag. 6 no.10-14.
 * `karyawanId` is resolved server-side from the session, never sent from here.
 */

function qs(status?: string): string {
	return status ? `?status=${encodeURIComponent(status)}` : "";
}

export function getAbsenceTypes(signal?: AbortSignal): Promise<{ items: AbsenceType[] }> {
	return api.get<{ items: AbsenceType[] }>("/api/v1/leave/types", { signal });
}

export function getLeaveBalance(
	year: number,
	signal?: AbortSignal,
): Promise<{ year: number; balance: LeaveBalance[] }> {
	return api.get<{ year: number; balance: LeaveBalance[] }>(`/api/v1/leave/balance?year=${year}`, {
		signal,
	});
}

export function getLeaveRequests(
	status?: string,
	signal?: AbortSignal,
): Promise<{ items: LeaveRequest[] }> {
	return api.get<{ items: LeaveRequest[] }>(`/api/v1/leave${qs(status)}`, { signal });
}

export function getOvertimeRequests(
	status?: string,
	signal?: AbortSignal,
): Promise<{ items: OvertimeRequest[] }> {
	return api.get<{ items: OvertimeRequest[] }>(`/api/v1/overtime${qs(status)}`, { signal });
}

export function getDutyRequests(
	status?: string,
	signal?: AbortSignal,
): Promise<{ items: DutyRequest[] }> {
	return api.get<{ items: DutyRequest[] }>(`/api/v1/duty${qs(status)}`, { signal });
}

export type LeaveInput = {
	leaveTypeId: number;
	startDate: string;
	endDate: string;
	reason?: string;
	address?: string;
	emergencyPhone?: string;
	attachment?: string;
};

export type OvertimeInput = {
	date: string;
	startTime: string;
	endTime: string;
	reason: string;
};

export type DutyInput = {
	dutyType: string;
	startDate: string;
	endDate: string;
	location?: string;
	purpose?: string;
	attachment?: string;
};

export function createLeave(input: LeaveInput): Promise<RequestActionResult> {
	return api.post<RequestActionResult>("/api/v1/leave", input);
}

export function createOvertime(input: OvertimeInput): Promise<RequestActionResult> {
	return api.post<RequestActionResult>("/api/v1/overtime", input);
}

export function createDuty(input: DutyInput): Promise<RequestActionResult> {
	return api.post<RequestActionResult>("/api/v1/duty", input);
}

export function updateLeaveStatus(id: string, action: RequestAction): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/leave", { id, action });
}

export function updateOvertimeStatus(id: string, action: RequestAction): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/overtime", { id, action });
}

export function updateDutyStatus(id: string, action: RequestAction): Promise<{ message: string }> {
	return api.put<{ message: string }>("/api/v1/duty", { id, action });
}

export type PickedFile = { uri: string; name: string; type: string };

export type UploadResult = { path: string; url: string; fileName: string };

/** `type` uses the backend approval reference code: CUTI | LEMBUR | DINAS. */
export type ApprovalStage = {
	stage: number;
	approverName: string | null;
	approverRole: string | null;
	status: string;
	note: string | null;
	processedAt: string | null;
};

export type RequestTimeline = {
	type: string;
	id: string;
	status: string;
	items: ApprovalStage[];
};

export function getTimeline(
	type: string,
	id: string,
	signal?: AbortSignal,
): Promise<RequestTimeline> {
	const query = `?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
	return api.get<RequestTimeline>(`/api/v1/approval/timeline${query}`, { signal });
}

/**
 * Upload a request attachment — `ownerType` "pengajuan" (PRD Bag. 6, `/api/files`).
 * File type & size are validated server-side (jpeg/png/webp/gif/pdf, 10 MB).
 */
export function uploadAttachment(file: PickedFile, ownerId: string): Promise<UploadResult> {
	const form = new FormData();
	form.append("ownerType", "pengajuan");
	form.append("ownerId", ownerId);
	form.append("subfolder", "lampiran");
	// React Native passes {uri,name,type} as the file part of FormData.
	form.append("file", file as unknown as Blob);
	return api.form<UploadResult>("/api/files", form);
}
