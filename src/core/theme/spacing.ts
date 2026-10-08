/** Skala spacing konsisten (kelipatan 4). */
export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
} as const;

/** Radius komponen. */
export const radius = {
	sm: 6,
	md: 10,
	lg: 16,
	full: 999,
} as const;

/** Ukuran font. */
export const fontSize = {
	xs: 12,
	sm: 14,
	md: 16,
	lg: 18,
	xl: 22,
	xxl: 28,
} as const;

/** Target sentuhan minimum agar nyaman (PRD Bag. 8 — ramah mobile). */
export const TOUCH_MIN = 44;
