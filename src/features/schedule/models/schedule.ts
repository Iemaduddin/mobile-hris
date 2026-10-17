/** `GET /api/v1/schedule` contract — mobile PRD Bag. 5.3.D (read-only). */

export type RosterShift = {
	/** `YYYY-MM-DD` */
	date: string;
	code: string;
	name: string;
	/** `HH:mm` */
	checkInTime: string | null;
	/** `HH:mm` */
	checkOutTime: string | null;
	/** `true` = overnight shift (e.g. 23:00–07:00). */
	overnight: boolean;
};

export type CalendarAssignment = {
	calendar: string;
	/** `YYYY-MM-DD` */
	start: string;
	/** `YYYY-MM-DD` | null (null = still running) */
	end: string | null;
};

export type MySchedule = {
	roster: RosterShift[];
	assignments: CalendarAssignment[];
	/** `YYYY-MM-DD` days off (HariLibur / kalender kerja / weekend) for the range. */
	libur: string[];
};
