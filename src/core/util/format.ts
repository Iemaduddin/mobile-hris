/**
 * Date & time helpers.
 * Weekday/month names are hardcoded for consistency across Hermes runtimes
 * (Intl lacks full ICU in React Native production builds).
 */

const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const LONG_MONTHS = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Parse a date-only string (`YYYY-MM-DD`, or ISO starting with that date)
 * as local time — avoids day-shifting from the UTC zone.
 */
export function parseLocalDate(value: string | Date): Date {
	if (value instanceof Date) return value;
	const [year, month, day] = value.slice(0, 10).split("-").map(Number);
	return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** `YYYY-MM-DD` from any Date or ISO string. */
export function toDateOnly(value: string | Date): string {
	const d = value instanceof Date ? value : parseLocalDate(value);
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Shift a date by `delta` days → `YYYY-MM-DD`. */
export function addDays(value: string | Date, delta: number): string {
	const d = parseLocalDate(value);
	d.setDate(d.getDate() + delta);
	return toDateOnly(d);
}

/** "HH:mm" from an ISO timestamp or Date. */
export function formatTime(value: string | Date | null | undefined): string {
	if (value == null || value === "") return "-";
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "-";
	return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "Sen, 5 Okt 2026" */
export function formatDate(value: string | Date): string {
	const d = parseLocalDate(value);
	return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "5 Oktober 2026" */
export function formatLongDate(value: string | Date): string {
	const d = parseLocalDate(value);
	return `${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Senin, 5 Oktober 2026 · 14.05" — home hero datetime (local time). */
export function formatDateTime(value: string | Date = new Date()): string {
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "-";
	return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()} · ${pad2(d.getHours())}.${pad2(d.getMinutes())}`;
}

/** "Sen" — calendar column header. */
export function shortWeekdayName(value: string | Date): string {
	return WEEKDAYS[parseLocalDate(value).getDay()].slice(0, 3);
}

/** "Okt 2026" */
export function formatMonthYear(month: number, year: number): string {
	return `${LONG_MONTHS[month - 1]} ${year}`;
}

/** "1 j 30 m" / "45 m" / "0 m" */
export function formatDuration(minutes: number): string {
	if (minutes <= 0) return "0 m";
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest} m`;
	return rest === 0 ? `${hours} j` : `${hours} j ${rest} m`;
}

/** "Rp1.500.000" — single currency formatter for every amount shown on mobile. */
export function formatIDR(value: string | number): string {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return "Rp0";
	return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

/** Friendly label for the daily attendance recap status. */
export function getAttendanceStatusLabel(status: string): string {
	switch (status) {
		case "HADIR":
			return "Hadir";
		case "TELAT":
			return "Telat";
		case "PULANG_CEPAT":
			return "Pulang Cepat";
		case "LEMBUR":
			return "Lembur";
		case "ALPA":
			return "Alpa";
		case "CUTI":
			return "Cuti";
		case "SAKIT":
			return "Sakit";
		case "IZIN":
			return "Izin";
		case "DINAS":
			return "Dinas";
		case "LIBUR":
			return "Libur";
		case "TANPA_JADWAL":
			return "Tanpa Jadwal";
		case "TERLAMBAT":
			return "Terlambat";
		default:
			return status;
	}
}

/** Chip tone for the daily recap status (UX-1: green=present, yellow=attention, red=absent). */
export function getAttendanceStatusTone(status: string): "info" | "success" | "warning" | "danger" | "muted" {
	switch (status) {
		case "HADIR":
			return "success";
		case "TELAT":
		case "TERLAMBAT":
		case "PULANG_CEPAT":
		case "LEMBUR":
			return "warning";
		case "ALPA":
			return "danger";
		case "CUTI":
		case "IZIN":
		case "SAKIT":
		case "DINAS":
			return "info";
		default:
			return "muted";
	}
}

/** Label for the attendance event type. */
export function getPresenceTypeLabel(tipe: string): string {
	switch (tipe) {
		case "MASUK":
			return "Masuk";
		case "KELUAR":
			return "Pulang";
		case "MULAI_ISTIRAHAT":
			return "Mulai Istirahat";
		case "SELESAI_ISTIRAHAT":
			return "Selesai Istirahat";
		case "KELUAR_KANTOR":
			return "Keluar Kantor";
		case "KEMBALI_KANTOR":
			return "Kembali Kantor";
		default:
			return tipe;
	}
}
