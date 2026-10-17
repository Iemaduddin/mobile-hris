/** Request payload contracts — mobile PRD Bag. 5.4 & Bag. 6 (no.10-14). */

export type RequestKind = "leave" | "overtime" | "duty";

export type RequestStatus =
	| "DRAFT"
	| "DIAJUKAN"
	| "MENUNGGU_APPROVAL"
	| "DISETUJUI"
	| "DITOLAK"
	| "DIBATALKAN"
	| "SELESAI";

export type RequestAction = "submit" | "cancel";

export type AbsenceType = {
  id: number;
  code: string;
  name: string;
  category: "CUTI" | "IZIN";
  usesBalance: boolean;
  annualQuota: string | null;
  requiresAttachment: boolean;
  isActive: boolean;
};

export type LeaveBalance = {
	id: number;
	employeeId: string;
	employeeName: string;
	leaveTypeName: string;
	year: number;
	openingBalance: string;
	closingBalance: string;
};

export type LeaveRequest = {
	id: string;
	number: string;
	employeeId: string;
	employeeName: string;
	leaveTypeName: string;
	usesBalance: boolean;
	startDate: string;
	endDate: string;
	totalDays: string;
	status: string;
};

export type OvertimeRequest = {
	id: string;
	employeeId: string;
	employeeName: string;
	date: string;
	startTime: string;
	endTime: string;
	totalHours: string;
	reason: string;
	status: string;
};

export type DutyRequest = {
	id: string;
	number: string;
	employeeId: string;
	employeeName: string;
	dutyType: string;
	startDate: string;
	endDate: string;
	location: string | null;
	status: string;
};

export type RequestActionResult = { success: boolean; message: string; id?: string };

/** Status filter offered on the Requests tab. */
export const FILTER_STATUS = [
	{ value: "", label: "Semua" },
	{ value: "DRAFT", label: "Draf" },
	{ value: "DIAJUKAN", label: "Diajukan" },
	{ value: "DISETUJUI", label: "Disetujui" },
	{ value: "DITOLAK", label: "Ditolak" },
] as const;

export const REQUEST_KINDS: readonly RequestKind[] = ["leave", "overtime", "duty"];

export function getRequestStatusLabel(status: string): string {
	switch (status) {
		case "DRAFT":
			return "Draf";
		case "DIAJUKAN":
			return "Diajukan";
		case "MENUNGGU_APPROVAL":
			return "Menunggu Approval";
		case "DISETUJUI":
			return "Disetujui";
		case "DITOLAK":
			return "Ditolak";
		case "DIBATALKAN":
			return "Dibatalkan";
		case "SELESAI":
			return "Selesai";
		default:
			return status;
	}
}

export type RequestTone = "info" | "success" | "warning" | "danger";

export function getRequestStatusTone(status: string): RequestTone {
	switch (status) {
		case "DISETUJUI":
		case "SELESAI":
			return "success";
		case "DITOLAK":
		case "DIBATALKAN":
			return "danger";
		case "DIAJUKAN":
		case "MENUNGGU_APPROVAL":
			return "warning";
		default:
			return "info";
	}
}

export function getRequestKindLabel(kind: RequestKind): string {
	if (kind === "leave") return "Cuti";
	if (kind === "overtime") return "Lembur";
	return "Dinas/WFH";
}

/** Still a draft — can be submitted or cancelled. */
export function canSubmit(status: string): boolean {
	return status === "DRAFT";
}

/** Requester may still withdraw the request — mobile PRD Bag. 5.4: DRAFT/DIAJUKAN only. */
export function canCancel(status: string): boolean {
	return status === "DRAFT" || status === "DIAJUKAN";
}
