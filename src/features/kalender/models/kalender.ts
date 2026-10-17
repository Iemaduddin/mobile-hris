import { addDays, toDateOnly } from "@/core/util/format";

/** First/last day of `month` (0-based) as `YYYY-MM-DD`. */
export function monthRange(year: number, month: number): { start: string; end: string } {
	return {
		start: toDateOnly(new Date(year, month, 1)),
		end: toDateOnly(new Date(year, month + 1, 0)),
	};
}

/** Monday-first grid of ISO dates covering `month` (0-based): 6 weeks x 7 days. */
export function monthMatrix(year: number, month: number): string[][] {
	const first = new Date(year, month, 1);
	let cursor = addDays(first, -((first.getDay() + 6) % 7));
	const weeks: string[][] = [];
	for (let w = 0; w < 6; w++) {
		const week: string[] = [];
		for (let d = 0; d < 7; d++) {
			week.push(cursor);
			cursor = addDays(cursor, 1);
		}
		weeks.push(week);
	}
	return weeks;
}
