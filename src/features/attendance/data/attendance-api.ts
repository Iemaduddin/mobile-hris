import { api } from "@/core/network/api-client";
import type {
	AttendanceInput,
	ClockResult,
	DayDetail,
	MonthlyHistory,
	TodayAttendanceStatus,
} from "../models/attendance";

/**
 * Mobile attendance endpoints — mobile PRD Bag. 6 no.6-8.
 * `deviceId`/`platform` are attached by the caller (see useClock).
 */

export function getTodayStatus(signal?: AbortSignal): Promise<TodayAttendanceStatus> {
	return api.get<TodayAttendanceStatus>("/api/v1/attendance", { signal });
}

export function recordAttendance(input: AttendanceInput): Promise<ClockResult> {
	return api.post<ClockResult>("/api/v1/attendance", input);
}

export function getMonthlyHistory(
	year: number,
	month: number,
	signal?: AbortSignal,
): Promise<MonthlyHistory> {
	const query = `?year=${year}&month=${month}`;
	return api.get<MonthlyHistory>(`/api/v1/attendance/history${query}`, { signal });
}

/** One-day detail (recap + event list) — mobile PRD Bag. 5.3.C. */
export function getDayDetail(date: string, signal?: AbortSignal): Promise<DayDetail> {
	return api.get<DayDetail>(`/api/v1/attendance/day?date=${date}`, { signal });
}
