import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createDuty,
	createLeave,
	createOvertime,
	getAbsenceTypes,
	getDutyRequests,
	getLeaveBalance,
	getLeaveRequests,
	getOvertimeRequests,
	getTimeline,
	updateDutyStatus,
	updateLeaveStatus,
	updateOvertimeStatus,
	uploadAttachment,
	type DutyInput,
	type LeaveInput,
	type OvertimeInput,
	type PickedFile,
} from "../data/requests-api";
import type {
	RequestAction,
	RequestActionResult,
	RequestKind,
} from "../models/request";

export const requestKeys = {
	all: ["requests"] as const,
	absenceTypes: () => [...requestKeys.all, "absence-types"] as const,
	balance: (year: number) => [...requestKeys.all, "balance", year] as const,
	leave: (status?: string) => [...requestKeys.all, "leave", status ?? "all"] as const,
	overtime: (status?: string) => [...requestKeys.all, "overtime", status ?? "all"] as const,
	duty: (status?: string) => [...requestKeys.all, "duty", status ?? "all"] as const,
	timeline: (kind: RequestKind, id: string) =>
		[...requestKeys.all, "timeline", kind, id] as const,
};

/** Backend approval reference code (CUTI/LEMBUR/DINAS) for one request kind. */
export function toReferenceCode(kind: RequestKind): string {
	if (kind === "leave") return "CUTI";
	if (kind === "overtime") return "LEMBUR";
	return "DINAS";
}

export function useAbsenceTypes() {
	return useQuery({
		queryKey: requestKeys.absenceTypes(),
		queryFn: ({ signal }) => getAbsenceTypes(signal),
		select: (data) => data.items.filter((x) => x.isActive),
	});
}

export function useLeaveBalance(year: number) {
	return useQuery({
		queryKey: requestKeys.balance(year),
		queryFn: ({ signal }) => getLeaveBalance(year, signal),
	});
}

export function useLeaveRequests(status?: string) {
	return useQuery({
		queryKey: requestKeys.leave(status),
		queryFn: ({ signal }) => getLeaveRequests(status, signal),
		select: (data) => data.items,
	});
}

export function useOvertimeRequests(status?: string) {
	return useQuery({
		queryKey: requestKeys.overtime(status),
		queryFn: ({ signal }) => getOvertimeRequests(status, signal),
		select: (data) => data.items,
	});
}

export function useDutyRequests(status?: string) {
	return useQuery({
		queryKey: requestKeys.duty(status),
		queryFn: ({ signal }) => getDutyRequests(status, signal),
		select: (data) => data.items,
	});
}

/** Approval history for one request (timeline on the detail screen). */
export function useTimeline(kind: RequestKind, id: string) {
	return useQuery({
		queryKey: requestKeys.timeline(kind, id),
		queryFn: ({ signal }) => getTimeline(toReferenceCode(kind), id, signal),
		enabled: id.length > 0,
	});
}

/** Upload a request attachment (mobile PRD Bag. 5.4 — supporting file). */
export function useUploadAttachment() {
	return useMutation({
		mutationFn: ({ file, ownerId }: { file: PickedFile; ownerId: string }) =>
			uploadAttachment(file, ownerId),
	});
}

type RequestInput =
	| { kind: "leave"; input: LeaveInput }
	| { kind: "overtime"; input: OvertimeInput }
	| { kind: "duty"; input: DutyInput };

/** Save a new request (DRAFT status, submitted from the same screen). */
export function useCreateRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ kind, input }: RequestInput): Promise<RequestActionResult> => {
			if (kind === "leave") return createLeave(input as LeaveInput);
			if (kind === "overtime") return createOvertime(input as OvertimeInput);
			return createDuty(input as DutyInput);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: requestKeys.all });
		},
	});
}

/** Submit / cancel a request (PUT /api/v1/{leave,overtime,duty}). */
export function useRequestAction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			kind,
			id,
			action,
		}: {
			kind: RequestKind;
			id: string;
			action: RequestAction;
		}): Promise<{ message: string }> => {
			if (kind === "leave") return updateLeaveStatus(id, action);
			if (kind === "overtime") return updateOvertimeStatus(id, action);
			return updateDutyStatus(id, action);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: requestKeys.all });
		},
	});
}
