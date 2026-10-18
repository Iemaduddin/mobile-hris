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
	href?: `/payslip` | `/profile` | `/approval` | `/pengaturan` | `/pengumuman` | `/reimburse` | `/kasbon` | `/koreksi` | `/tukar` | `/update-data` | `/uangdinas` | `/onboarding` | `/kalender` | `/tim` | `/karyawan` | `/pengumuman/baru`;
	soon?: boolean;
	roles?: string[];
};

/** Lainnya (PRD mobile Bag. 4): Slip Gaji, Profil, Persetujuan, Pengumuman, Reimbursement, Pengaturan, Logout. */
const MENU: MenuItem[] = [
	{ label: "Kalender", icon: "calendar-number-outline", href: "/kalender" },
	{ label: "Slip Gaji", icon: "wallet-outline", href: "/payslip" },
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
		href: "/tim",
		roles: ["MANAJER", "ADMIN_HR", "SUPER_ADMIN"],
	},
	{
		label: "Direktori Karyawan",
		icon: "id-card-outline",
		href: "/karyawan",
		roles: ["ADMIN_HR", "SUPER_ADMIN"],
	},
	{ label: "Pengumuman", icon: "megaphone-outline", href: "/pengumuman" },
	{
		label: "Terbitkan Pengumuman",
		icon: "paper-plane-outline",
		href: "/pengumuman/baru",
		roles: ["ADMIN_HR", "SUPER_ADMIN"],
	},
	{ label: "Reimbursement", icon: "receipt-outline", href: "/reimburse" },
	{ label: "Kasbon Saya", icon: "cash-outline", href: "/kasbon" },
	{ label: "Koreksi Presensi", icon: "time-outline", href: "/koreksi" },
	{ label: "Tukar Shift", icon: "swap-horizontal-outline", href: "/tukar" },
	{ label: "Update Data", icon: "person-add-outline", href: "/update-data" },
	{ label: "Uang Dinas", icon: "briefcase-outline", href: "/uangdinas" },
	{ label: "Onboarding", icon: "clipboard-outline", href: "/onboarding" },
	{ label: "Pengaturan", icon: "settings-outline", href: "/pengaturan" },
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

