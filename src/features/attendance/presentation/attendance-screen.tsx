import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { AppButton, ErrorView, LoadingView, Notice, ScreenHeader, type NoticeProps } from "@/core/widgets";
import {
	detectLocationAnomaly,
	getLocationAnomalyMessage,
	getPosition,
	getPositionErrorMessage,
	type DevicePosition,
	type LocationAnomaly,
} from "@/core/location/location-service";
import { measureDistanceMeters, validateRadius } from "@/core/location/geo";
import { myWorkLocation } from "@/features/auth/models/session";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import {
	formatTime,
	formatLongDate,
	getAttendanceStatusLabel,
	getPresenceTypeLabel,
} from "@/core/util/format";
import {
	useAttendanceQueue,
	useClock,
	useTodayStatus,
	type ClockActionResult,
} from "../providers/attendance-queries";
import type { AttendanceEventType } from "../models/attendance";

type CheckResult =
	| { ok: true; position: DevicePosition; isOutsideRadius: boolean | null; distanceMeters: number | null }
	| { ok: false; message: string };

/**
 * Attendance screen (mobile PRD Bag. 5.3.A-C):
 * today's status, GPS clock-in/out buttons, and the event list.
 */
export default function AttendanceScreen() {
	const employee = useAuthStore((s) => s.employee);
	const workplace = myWorkLocation(employee);
	const { data, isLoading, isError, refetch } = useTodayStatus();
	const { clock, phase, isSending } = useClock();
	const { pending, isFlushing, flush } = useAttendanceQueue();

	const [notice, setNotice] = useState<NoticeProps | null>(null);
	const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
	const [checkingLocation, setCheckingLocation] = useState(false);

	const events = useMemo(() => data?.events ?? [], [data]);
	const hasCheckedIn = events.some((event) => event.eventType === "MASUK");
	const hasCheckedOut = events.some((event) => event.eventType === "KELUAR");
	const isBusy = phase !== "idle" || isSending;

	/** Anomali lokasi pada hasil "Cek lokasi" terakhir (P6-5). */
	const checkAnomaly = useMemo(
		() => (checkResult?.ok ? detectLocationAnomaly(checkResult.position) : null),
		[checkResult],
	);

	// P6-5: antrean offline dikirim ulang otomatis begitu layar presensi dibuka.
	const flushedOnce = useRef(false);
	useEffect(() => {
		if (flushedOnce.current || pending === 0) return;
		flushedOnce.current = true;
		void flush();
	}, [pending, flush]);

	const confirmMockGps = useCallback(
		(anomaly: LocationAnomaly) =>
			new Promise<boolean>((resolve) => {
				Alert.alert(
					"Lokasi terdeteksi mencurigakan",
					`${anomaly.reason ? getLocationAnomalyMessage(anomaly.reason) : ""} Presensi tetap dapat dikirim dan akan ditandai untuk ditinjau HR.`,
					[
						{ text: "Batal", style: "cancel", onPress: () => resolve(false) },
						{ text: "Tetap Kirim", onPress: () => resolve(true) },
					],
				);
			}),
		[],
	);

	const runClock = useCallback(
		async (eventType: AttendanceEventType) => {
			setNotice(null);
			const result = await clock(eventType, { confirmMockGps });

			if (result.status === "recorded") {
				setNotice(buildResultNotice(result));
				// Kiriman sukses = koneksi kembali → coba habiskan antrean lama.
				void flush();
			} else if (result.status === "queued") {
				setNotice({
					tone: "warning",
					title: "Presensi disimpan di perangkat",
					description: `Tidak ada koneksi ke server. ${result.pending} presensi menunggu dan akan dikirim otomatis saat online. Waktu presensi dicatat saat tombol ditekan.`,
				});
			} else if (result.status === "failed") {
				setNotice({ tone: "danger", title: "Gagal mencatat presensi", description: result.message });
			}
		},
		[clock, confirmMockGps, flush],
	);

	/** Kirim manual antrean offline + laporkan hasilnya. */
	const handleFlush = useCallback(async () => {
		const result = await flush();
		if (result.sent === 0 && !result.error) return;

		setNotice({
			tone: result.error ? "warning" : "success",
			title: result.sent > 0 ? `${result.sent} presensi terkirim` : "Antrean belum terkirim",
			description:
				result.error ??
				(result.remaining > 0
					? `${result.remaining} presensi masih menunggu koneksi.`
					: "Semua presensi antrean sudah terkirim."),
		});
	}, [flush]);

	const checkLocation = useCallback(async () => {
		setCheckingLocation(true);
		try {
			const result = await getPosition();
			if (!result.ok) {
				setCheckResult({ ok: false, message: getPositionErrorMessage(result.reason) });
				return;
			}
			setCheckResult({
				ok: true,
				position: result.position,
				isOutsideRadius: validateRadius(result.position, workplace),
				distanceMeters:
					workplace?.latitude != null && workplace?.longitude != null
						? Math.round(
								measureDistanceMeters(
									result.position.latitude,
									result.position.longitude,
									workplace.latitude,
									workplace.longitude,
								),
							)
						: null,
			});
		} finally {
			setCheckingLocation(false);
		}
	}, [workplace]);

	const header = <ScreenHeader title="Presensi" subtitle={formatLongDate(new Date())} hideBack />;

	if (isLoading) {
		return (
			<>
				{header}
				<LoadingView />
			</>
		);
	}
	if (isError || !data) {
		return (
			<>
				{header}
				<ErrorView message="Gagal memuat status presensi." onRetry={() => void refetch()} />
			</>
		);
	}

	const noSchedule = data.status === "TANPA_JADWAL";

	return (
		<>
			{header}

			<ScrollView style={styles.safe} contentContainerStyle={styles.content}>
				{notice ? <Notice {...notice} /> : null}

				<View style={styles.card}>
					<Text style={styles.cardLabel}>Status hari ini</Text>
					<Text style={[styles.status, noSchedule && styles.statusNeutral]}>
						{getAttendanceStatusLabel(data.status)}
					</Text>
					{data.lateMinutes ? <Text style={styles.late}>Telat {data.lateMinutes} menit</Text> : null}

					<View style={styles.timeRow}>
						<View style={styles.timeItem}>
							<Text style={styles.timeLabel}>Masuk</Text>
							<Text style={styles.timeValue}>{formatTime(data.actualCheckIn)}</Text>
						</View>
						<View style={styles.divider} />
						<View style={styles.timeItem}>
							<Text style={styles.timeLabel}>Pulang</Text>
							<Text style={styles.timeValue}>{formatTime(data.actualCheckOut)}</Text>
						</View>
					</View>
				</View>

				<View style={styles.card}>
					<View style={styles.rowBetween}>
						<View style={{ flex: 1 }}>
							<Text style={styles.cardLabel}>Lokasi kerja</Text>
							<Text style={styles.siteName}>{workplace?.name ?? "Belum ditentukan"}</Text>
							<Text style={styles.siteMeta}>
								{workplace?.radiusMeters
									? `Radius validasi ${workplace.radiusMeters} m`
									: "Titik & radius belum diatur — hubungi HR"}
							</Text>
						</View>
						<Pressable
							onPress={() => void checkLocation()}
							disabled={checkingLocation}
							style={styles.checkButton}
							accessibilityRole="button"
						>
							{checkingLocation ? (
								<ActivityIndicator size="small" color={colors.primary} />
							) : (
								<Text style={styles.checkLabel}>Cek lokasi</Text>
							)}
						</Pressable>
					</View>

					{checkResult ? (
						<View style={styles.checkResult}>
							{checkResult.ok ? (
								<>
									<Text style={styles.checkResultText}>
										{checkResult.distanceMeters == null
											? "Koordinat terbaca."
											: `Jarak ke lokasi: ${checkResult.distanceMeters} m`}
									</Text>
									<Text style={[styles.checkResultText, styles[getRadiusTone(checkResult.isOutsideRadius)]]}>
										{getRadiusLabel(checkResult.isOutsideRadius)}
									</Text>
									{checkAnomaly?.reason ? (
										<Text style={[styles.checkResultText, styles.textWarning]}>
											{getLocationAnomalyMessage(checkAnomaly.reason)}
										</Text>
									) : null}
								</>
							) : (
								<Text style={styles.checkResultText}>{checkResult.message}</Text>
							)}
						</View>
					) : null}
				</View>

				{pending > 0 ? (
					<View style={[styles.card, styles.pendingCard]}>
						<View style={styles.rowBetween}>
							<View style={{ flex: 1 }}>
								<Text style={styles.cardLabel}>Antrean offline</Text>
								<Text style={styles.pendingText}>
									{pending} presensi belum terkirim — dikirim otomatis saat koneksi kembali.
								</Text>
							</View>
							<Pressable
								onPress={() => void handleFlush()}
								disabled={isFlushing}
								style={styles.checkButton}
								accessibilityRole="button"
								accessibilityLabel="Kirim antrean presensi sekarang"
							>
								{isFlushing ? (
									<ActivityIndicator size="small" color={colors.primary} />
								) : (
									<Text style={styles.checkLabel}>Kirim sekarang</Text>
								)}
							</Pressable>
						</View>
					</View>
				) : null}

				<View style={styles.buttonRow}>
					<AppButton
						label="MASUK"
						onPress={() => void runClock("MASUK")}
						loading={isBusy}
						disabled={isBusy || hasCheckedIn}
						style={styles.button}
					/>
					<AppButton
						label="KELUAR"
						variant="outline"
						onPress={() => void runClock("KELUAR")}
						loading={isBusy}
						disabled={isBusy || !hasCheckedIn || hasCheckedOut}
						style={styles.button}
					/>
				</View>

				{phase === "fetching_location" ? (
					<Text style={styles.progressText}>Mengambil lokasi perangkat…</Text>
				) : null}
				{phase === "sending" ? <Text style={styles.progressText}>Mengirim presensi…</Text> : null}

				<View style={styles.card}>
					<View style={styles.rowBetween}>
						<Text style={styles.cardLabel}>Event hari ini</Text>
						<Link href="/attendance/riwayat" asChild>
							<Pressable accessibilityRole="button" hitSlop={8}>
								<Text style={styles.checkLabel}>Riwayat</Text>
							</Pressable>
						</Link>
					</View>

					{events.length === 0 ? (
						<Text style={styles.empty}>Belum ada event presensi hari ini.</Text>
					) : (
						events.map((event) => (
							<View key={`${event.eventType}-${event.time}`} style={styles.eventRow}>
								<View style={{ flex: 1 }}>
									<Text style={styles.eventType}>{getPresenceTypeLabel(event.eventType)}</Text>
									<Text style={styles.eventMeta}>
										{formatTime(event.time)} · {event.source}
									</Text>
								</View>
								<View style={styles.eventFlags}>
									{event.terlambatKirim ? (
										<Text style={[styles.flag, styles.flagWarning]}>Terlambat kirim</Text>
									) : null}
									{event.isOutsideRadius ? (
										<Text style={[styles.flag, styles.flagDanger]}>Luar radius</Text>
									) : null}
									{event.isMocked ? <Text style={[styles.flag, styles.flagWarning]}>Mock</Text> : null}
								</View>
							</View>
						))
					)}
				</View>
			</ScrollView>
		</>
	);
}

function getRadiusLabel(isOutsideRadius: boolean | null): string {
	if (isOutsideRadius === null)
		return "Kantor ini belum diatur titik & radiusnya — hubungi HR agar validasi lokasi aktif.";
	return isOutsideRadius ? "Di luar radius validasi." : "Di dalam radius validasi.";
}

function getRadiusTone(isOutsideRadius: boolean | null): "textDanger" | "textSuccess" | "textMuted" {
	if (isOutsideRadius === null) return "textMuted";
	return isOutsideRadius ? "textDanger" : "textSuccess";
}

/** Build the clock-in result banner per mobile PRD Bag. 5.3.A item 4. */
function buildResultNotice(result: Extract<ClockActionResult, { status: "recorded" }>): NoticeProps {
	const { data, locationWarning } = result;
	const parts: string[] = [];

	if (data.isOutsideRadius === true) {
		parts.push(
			data.distanceMeters != null
				? `Di luar radius — jarak ${data.distanceMeters} m dari lokasi kerja.`
				: "Di luar radius lokasi kerja.",
		);
	} else if (data.isOutsideRadius === false) {
		parts.push("Di dalam radius lokasi kerja.");
	} else if (locationWarning) {
		// GPS failed — the detailed warning already shows below, no need to double it.
	} else {
		parts.push("Titik & radius kantor belum diatur HR — presensi tetap sah.");
	}

	if (data.isMocked) {
		parts.push("Lokasi terdeteksi simulasi (mock) dan disimpan dengan flag.");
	}
	if (locationWarning) parts.push(locationWarning);

	const hasIssue = data.isOutsideRadius === true || data.isMocked;

	return {
		tone: hasIssue ? "warning" : "success",
		title: `${getPresenceTypeLabel(data.eventType)} tercatat · ${formatTime(data.time)}`,
		description: parts.join(" "),
	};
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },

	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.lg,
		gap: spacing.sm,
	},
	cardLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" },
	status: { fontSize: fontSize.xl, fontWeight: "700", color: colors.success },
	statusNeutral: { color: colors.textMuted },
	late: { fontSize: fontSize.sm, color: colors.warning, fontWeight: "600" },
	timeRow: { flexDirection: "row", marginTop: spacing.sm },
	timeItem: { flex: 1, gap: spacing.xs },
	timeLabel: { fontSize: fontSize.xs, color: colors.textMuted },
	timeValue: { fontSize: fontSize.lg, fontWeight: "600", color: colors.text },
	divider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },

	rowBetween: { flexDirection: "row", alignItems: "center", gap: spacing.md },
	siteName: { fontSize: fontSize.md, fontWeight: "600", color: colors.text, marginTop: spacing.xs },
	siteMeta: { fontSize: fontSize.xs, color: colors.textMuted },
	checkButton: {
		minHeight: TOUCH_MIN,
		justifyContent: "center",
		paddingHorizontal: spacing.md,
		borderRadius: radius.full,
		borderWidth: 1.5,
		borderColor: colors.primary,
	},
	checkLabel: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
	checkResult: {
		marginTop: spacing.sm,
		padding: spacing.md,
		borderRadius: radius.md,
		backgroundColor: colors.backgroundAlt,
		gap: spacing.xs,
	},
	checkResultText: { fontSize: fontSize.sm, color: colors.text },
	pendingCard: { borderColor: colors.warning, backgroundColor: colors.warningLight },
	pendingText: { fontSize: fontSize.sm, color: colors.text },
	textDanger: { color: colors.danger, fontWeight: "600" },
	textSuccess: { color: colors.success, fontWeight: "600" },
	textWarning: { color: colors.warning, fontWeight: "600" },
	textMuted: { color: colors.textMuted },

	buttonRow: { flexDirection: "row", gap: spacing.md },
	button: { flex: 1 },
	progressText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center" },

	empty: { fontSize: fontSize.sm, color: colors.textMuted },
	eventRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	eventType: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
	eventMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
	eventFlags: { flexDirection: "row", gap: spacing.xs },
	flag: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: radius.full,
		overflow: "hidden",
	},
	flagDanger: { backgroundColor: colors.dangerLight, color: colors.danger },
	flagWarning: { backgroundColor: colors.warningLight, color: colors.warning },
});
