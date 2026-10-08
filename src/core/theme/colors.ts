/** Palet warna — ringkas, siap disesuaikan dengan branding web. */
export const colors = {
	primary: "#208AEF",
	primaryDark: "#156BBF",
	primaryLight: "#E6F4FE",

	success: "#16A34A",
	successLight: "#DCFCE7",
	warning: "#D97706",
	warningLight: "#FEF3C7",
	danger: "#DC2626",
	dangerLight: "#FEE2E2",

	text: "#0F172A",
	textMuted: "#64748B",
	textInverse: "#FFFFFF",

	background: "#FFFFFF",
	backgroundAlt: "#F8FAFC",
	surface: "#FFFFFF",
	border: "#E2E8F0",

	disabled: "#CBD5E1",
} as const;

export type ColorKey = keyof typeof colors;
