import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import {
	formatDate,
	formatIDR,
	formatTime,
	getAttendanceStatusLabel,
	getAttendanceStatusTone,
} from "@/core/util/format";
import { AppButton } from "@/core/widgets/app-button";
import { AvatarPhoto } from "@/core/widgets/avatar-foto";
import { Skeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { getPlacementLabel } from "@/features/auth/models/session";
import { getRequestStatusLabel, getRequestStatusTone } from "@/features/requests/models/request";
import { getInitials } from "@/features/profile/models/profile";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { useTodayStatus } from "@/features/attendance/providers/attendance-queries";
import {
	useDutyRequests,
	useLeaveBalance,
	useLeaveRequests,
	useOvertimeRequests,
} from "@/features/requests/providers/requests-queries";
import { usePayslipList } from "@/features/payslip/providers/payslip-queries";
import { getPeriodLabel } from "@/features/payslip/models/payslip";

const CURRENT_YEAR = new Date().getFullYear();

/** Ucapan selamat sesuai jam perangkat. */
function getGreeting(now: Date): string {
	const hour = now.getHours();
	if (hour >= 4 && hour < 11) return "Selamat pagi";
	if (hour >= 11 && hour < 15) return "Selamat siang";
	if (hour >= 15 && hour < 19) return "Selamat sore";
	return "Selamat malam";
}

/** Statuses still in flight (undecided). */
const ACTIVE_STATUSES = new Set(["DRAFT", "DIAJUKAN", "MENUNGGU_APPROVAL"]);

type CardProps = {
	title: string;
	subtitle?: string;
	onPress?: () => void;
	children?: React.ReactNode;
};

/**
 * ESS Home / Dashboard (mobile PRD Bag. 5.2).
 * Composed from existing endpoints: today's attendance, leave balance,
 * in-flight requests, and the latest payslip — all self-owned.
 */
export function HomeScreen() {
	const user = useAuthStore((s) => s.user);
	const employee = useAuthStore((s) => s.employee);
	const signOut = useAuthStore((s) => s.signOut);

	const attendance = useTodayStatus();
	const balance = useLeaveBalance(CURRENT_YEAR);
	const leave = useLeaveRequests();
	const overtime = useOvertimeRequests();
	const duty = useDutyRequests();
	const payslips = usePayslipList();

	const queries = [attendance, balance, leave, overtime, duty, payslips];
	const loading = queries.some((q) => q.isPending);
	const refetchAll = () => {
		void Promise.all(queries.map((q) => q.refetch()));
	};

	const placement = getPlacementLabel(employee);
	const status = attendance.data?.status ?? null;
	const checkIn = attendance.data?.actualCheckIn;
	const checkOut = attendance.data?.actualCheckOut;

	const activeRequests = [ ...(leave.data ?? []), ...(overtime.data ?? []), ...(duty.data ?? []) ].filter(
		(x) => ACTIVE_STATUSES.has(x.status),
	);
	const latestSlip = payslips.data?.[0] ?? null;

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={!loading && attendance.isRefetching}
						onRefresh={refetchAll}
						tintColor={colors.primary}
					/>
				}
			>
				<View style={styles.topBar}>
					<View style={{ flex: 1 }}>
					<Text style={styles.greeting}>Hi, {employee?.fullName ?? user?.name ?? "-"}</Text>
					<Text style={styles.greeting}>{getGreeting(new Date())}</Text>
					</View>
					<Pressable
						onPress={() => router.push("/notifikasi")}
						accessibilityRole="button"
						accessibilityLabel="Notifikasi"
						style={styles.iconButton}
					>
						<Ionicons name="notifications-outline" size={22} color={colors.primaryDark} />
					</Pressable>
					<Pressable
						onPress={() => void signOut()}
						accessibilityRole="button"
						accessibilityLabel="Keluar"
						style={styles.iconButton}
					>
						<Ionicons name="log-out-outline" size={22} color={colors.primaryDark} />
					</Pressable>
				</View>

			<View style={styles.hero}>
				<Pressable
					onPress={() => router.push("/profile")}
					accessibilityRole="button"
					accessibilityLabel="Buka profil saya"
				>
					<AvatarPhoto
						name={employee?.fullName ?? user?.name ?? "-"}
						initials={getInitials(employee?.fullName ?? user?.name ?? "-")}
						photoPath={employee?.photoUrl}
						size={76}
					/>
				</Pressable>
				<View style={styles.heroText}>
					<Text numberOfLines={1}>
						{employee?.employeeNumber ?? "-"}
					</Text>
					<View style={styles.metaRow}>
						<Ionicons name="calendar-outline" size={13} color={colors.primaryDark} />
						<Text style={styles.date}>{formatDate(new Date())}</Text>
					</View>
					{placement ? (
						<View style={styles.metaRow}>
							<Ionicons name="briefcase-outline" size={13} color={colors.primaryDark} />
							<Text style={styles.placement} numberOfLines={1}>
								{placement}
							</Text>
						</View>
					) : null}
				</View>
			</View>

				<Card title="Presensi hari ini" onPress={() => router.push("/attendance")}>
					{status ? (
						<>
							<StatusChip label={getAttendanceStatusLabel(status)} tone={getAttendanceStatusTone(status)} />
							<Text style={styles.time}>
								{checkIn ? formatTime(checkIn) : "--:--"} – {checkOut ? formatTime(checkOut) : "--:--"}
							</Text>
						</>
					) : attendance.isPending ? (
						<>
							<Skeleton width="40%" height={20} />
							<Skeleton width="60%" />
						</>
					) : (
						<Text style={styles.time}>Status belum tersedia.</Text>
					)}
				</Card>

				<Card title={`Sisa saldo cuti ${CURRENT_YEAR}`}>
					{balance.data?.balance.length ? (
						balance.data.balance.map((s) => (
							<View key={s.id} style={styles.row}>
								<Text style={styles.rowLabel}>{s.leaveTypeName}</Text>
								<Text style={styles.rowValue}>{s.closingBalance} hari</Text>
							</View>
						))
					) : balance.isPending ? (
						<>
							<Skeleton width="80%" />
							<Skeleton width="65%" />
						</>
					) : (
						<Text style={styles.time}>Belum ada saldo cuti.</Text>
					)}
				</Card>

				<Card
					title="Pengajuan berjalan"
					subtitle={activeRequests.length > 0 ? `${activeRequests.length} pengajuan` : undefined}
					onPress={() => router.push("/requests")}
				>
					{activeRequests.length > 0 ? (
						<View style={styles.chipRow}>
							<StatusChip
								label={getRequestStatusLabel(activeRequests[0].status)}
								tone={getRequestStatusTone(activeRequests[0].status)}
							/>
							<Text style={styles.time}>terakhir</Text>
						</View>
					) : (
						<Text style={styles.time}>Tidak ada pengajuan berjalan.</Text>
					)}
				</Card>

				<Card
					title="Slip gaji terakhir"
					subtitle={latestSlip ? getPeriodLabel(latestSlip.period) : undefined}
					onPress={() => router.push("/payslip")}
				>
					{latestSlip ? (
						<Text style={styles.slipValue}>{formatIDR(latestSlip.netPay)}</Text>
					) : payslips.isPending ? (
						<Skeleton width="50%" height={22} />
					) : (
						<Text style={styles.time}>Belum ada slip gaji terbit.</Text>
					)}
				</Card>

				<View style={styles.quickActions}>
					<QuickAction icon="calendar-outline" label="Jadwal" onPress={() => router.push("/schedule")} />
					<QuickAction icon="document-text-outline" label="Slip Gaji" onPress={() => router.push("/payslip")} />
					<QuickAction icon="person-outline" label="Profil" onPress={() => router.push("/profile")} />
				</View>

				<AppButton
					label="Lihat Semua Presensi"
					variant="outline"
					onPress={() => router.push("/attendance/riwayat")}
				/>
			</ScrollView>
		</SafeAreaView>
	);
}

function Card({ title, subtitle, onPress, children }: CardProps) {
	const body = (
		<View style={styles.card}>
			<View style={styles.cardHead}>
				<Text style={styles.cardTitle}>{title}</Text>
				{subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
			</View>
			<View>{children}</View>
			{onPress ? <Text style={styles.cardAction}>Lihat ›</Text> : null}
		</View>
	);

	if (!onPress) return body;

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={title}
			style={({ pressed }) => [pressed && styles.cardPressed]}
		>
			{body}
		</Pressable>
	);
}

function QuickAction({
	icon,
	label,
	onPress,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={label}
			style={({ pressed }) => [styles.quickActionItem, pressed && styles.cardPressed]}
		>
			<Ionicons name={icon} size={22} color={colors.primary} />
			<Text style={styles.quickActionLabel}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },

	topBar: { flexDirection: "row", alignItems: "center", gap: spacing.md },
	greeting: { flex: 1, fontSize: fontSize.md, fontWeight: "600", color: colors.text },
	hero: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		backgroundColor: colors.primaryLight,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.primary,
		padding: spacing.lg,
		marginBottom: spacing.sm,
	},
	heroText: { flex: 1, gap: 2 },
	iconButton: {
		width: TOUCH_MIN,
		height: TOUCH_MIN,
		borderRadius: radius.full,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
	},
	name: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
	metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 2 },
	date: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: "600" },
	placement: { flex: 1, fontSize: fontSize.xs, color: colors.primaryDark },

	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.lg,
		gap: spacing.sm,
	},
	cardPressed: { backgroundColor: colors.backgroundAlt },
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	cardTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	cardSubtitle: { fontSize: fontSize.xs, color: colors.textMuted },
	cardAction: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" },

	chipRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	time: { fontSize: fontSize.sm, color: colors.textMuted },
	slipValue: { fontSize: fontSize.lg, fontWeight: "700", color: colors.success },

	row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	rowLabel: { fontSize: fontSize.sm, color: colors.text },
	rowValue: { fontSize: fontSize.sm, fontWeight: "700", color: colors.primaryDark },

	quickActions: { flexDirection: "row", gap: spacing.sm },
	quickActionItem: {
		flex: 1,
		minHeight: TOUCH_MIN + 12,
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		paddingVertical: spacing.md,
	},
	quickActionLabel: { fontSize: fontSize.xs, color: colors.text, fontWeight: "600" },
});
