import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton } from "@/core/widgets";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { useProfile } from "@/features/profile/providers/profile-queries";
type MenuItem = {
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
	href?: `/payslips` | `/profile` | `/approval` | `/settings` | `/announcements` | `/reimbursements` | `/salary-advances` | `/corrections` | `/shift-swaps` | `/data-updates` | `/business-travel` | `/onboarding` | `/calendar` | `/team` | `/employees` | `/announcements/new`;
	soon?: boolean;
	roles?: string[];
};

/** Lainnya (PRD mobile Bag. 4): Slip Gaji, Profil, Persetujuan, Announcement, Reimbursement, Settings, Logout. */
const MENU: MenuItem[] = [
	{ label: "Calendar", icon: "calendar-number-outline", href: "/calendar" },
	{ label: "Slip Gaji", icon: "wallet-outline", href: "/payslips" },
	{ label: "Profil Saya", icon: "person-outline", href: "/profile" },
	{
		label: "Persetujuan",
		icon: "checkmark-circle-outline",
		href: "/approval",
		roles: ["MANAJER", "ADMIN_HR", "SUPER_ADMIN", "FINANCE"],
	},
	{
		label: "Tim Saya",
		icon: "people-outline",
		href: "/team",
		roles: ["MANAJER", "ADMIN_HR", "SUPER_ADMIN"],
	},
	{
		label: "Direktori Karyawan",
		icon: "id-card-outline",
		href: "/employees",
		roles: ["ADMIN_HR", "SUPER_ADMIN"],
	},
	{ label: "Announcement", icon: "megaphone-outline", href: "/announcements" },
	{
		label: "Terbitkan Announcement",
		icon: "paper-plane-outline",
		href: "/announcements/new",
		roles: ["ADMIN_HR", "SUPER_ADMIN"],
	},
	{ label: "Reimbursement", icon: "receipt-outline", href: "/reimbursements" },
	{ label: "SalaryAdvance Saya", icon: "cash-outline", href: "/salary-advances" },
	{ label: "Correction Presensi", icon: "time-outline", href: "/corrections" },
	{ label: "ShiftSwap Shift", icon: "swap-horizontal-outline", href: "/shift-swaps" },
	{ label: "Update Data", icon: "person-add-outline", href: "/data-updates" },
	{ label: "Uang Dinas", icon: "briefcase-outline", href: "/business-travel" },
	{ label: "Onboarding", icon: "clipboard-outline", href: "/onboarding" },
	{ label: "Settings", icon: "settings-outline", href: "/settings" },
];

export default function MoreRoute() {
	const signOut = useAuthStore((s) => s.signOut);
	const profile = useProfile();
	const role = profile.data?.role ?? null;
	const visible = MENU.filter((item) => !item.roles || (role !== null && item.roles.includes(role)));

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.title}>Lainnya</Text>

				<View style={styles.card}>
					{visible.map((item, index) => (
						<Pressable
							key={item.label}
							disabled={item.soon}
							onPress={() => item.href && router.push(item.href)}
							style={({ pressed }) => [
								styles.row,
								index > 0 && styles.rowBorder,
								pressed && !item.soon && styles.rowPressed,
								item.soon && styles.rowDisabled,
							]}
							accessibilityRole="button"
						>
							<Ionicons name={item.icon} size={20} color={colors.primary} />
							<Text style={styles.rowLabel}>{item.label}</Text>
							{item.soon ? (
								<Text style={styles.rowSoon}>Segera</Text>
							) : (
								<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
							)}
						</Pressable>
					))}
				</View>

				<AppButton label="Keluar" variant="danger" onPress={() => void signOut()} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
	title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		overflow: "hidden",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		minHeight: TOUCH_MIN + 8,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
	rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
	rowPressed: { backgroundColor: colors.backgroundAlt },
	rowDisabled: { opacity: 0.55 },
	rowLabel: { flex: 1, fontSize: fontSize.md, color: colors.text },
	rowSoon: { fontSize: fontSize.xs, color: colors.textMuted },
});
