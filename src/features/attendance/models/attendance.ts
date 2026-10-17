/** Attendance data contracts — mirrors `/api/v1/attendance[...]` (mobile PRD Bag. 5.3). */

export const ATTENDANCE_EVENT_TYPES = [
	"MASUK",
	"KELUAR",
	"MULAI_ISTIRAHAT",
	"SELESAI_ISTIRAHAT",
	"KELUAR_KANTOR",
	"KEMBALI_KANTOR",
] as const;

export type AttendanceEventType = (typeof ATTENDANCE_EVENT_TYPES)[number];

export type TodayEvent = {
	eventType: AttendanceEventType;
	time: string;
	source: string;
	/** `null` = location not judged (no GPS / site without radius). */
	isOutsideRadius: boolean | null;
	isMocked: boolean;
};

/**
 * `GET /api/v1/attendance` response.
 * Without a schedule the backend only sends `{status: "TANPA_JADWAL", recap: null}`.
 */
export type TodayAttendanceStatus = {
	status: string;
	recap?: null;
	lateMinutes?: number | null;
	actualCheckIn?: string | null;
	actualCheckOut?: string | null;
	events?: TodayEvent[];
};

export type AttendanceInput = {
	eventType: AttendanceEventType;
	/** Device identity for audits (mobile PRD Bag. 7-B5). */
	deviceId?: string;
	deviceName?: string;
	platform?: string;
	latitude?: number;
	longitude?: number;
	isMocked?: boolean;
	workLocationId?: string;
};

export type ClockResult = {
	message: string;
	eventType: AttendanceEventType;
	time: string;
	/** `true` = outside radius, `false` = inside, `null` = not judged. */
	isOutsideRadius: boolean | null;
	isMocked: boolean;
	distanceMeters: number | null;
};

export type DailyRecap = {
	id: number;
	employeeId: string;
	employeeName: string;
	employeeNumber: string;
	date: string;
	status: string;
	lateMinutes: number;
	earlyLeaveMinutes: number;
	overtimeMinutes: number;
	actualCheckIn: string | null;
	actualCheckOut: string | null;
};

export type MonthlyHistory = {
	year: number;
	month: number;
	items: DailyRecap[];
};

export type DayEvent = {
	eventType: AttendanceEventType;
	time: string;
	source: string;
	status: string;
	/** `null` = location not judged (no GPS / site without radius). */
	isOutsideRadius: boolean | null;
	isMocked: boolean;
	note: string | null;
};

/** `GET /api/v1/attendance/day?date=YYYY-MM-DD` response. */
export type DayDetail = {
	/** `YYYY-MM-DD` */
	date: string;
	status: string;
	lateMinutes: number | null;
	earlyLeaveMinutes: number | null;
	overtimeMinutes: number | null;
	actualCheckIn: string | null;
	actualCheckOut: string | null;
	events: DayEvent[];
};
