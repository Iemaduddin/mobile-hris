import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { formatDate } from "@/core/util/format";
import { ApiException } from "@/core/network/api-exception";
import { AppButton } from "@/core/widgets/app-button";
import { Notice, type NoticeProps } from "@/core/widgets/notice";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView, LoadingView } from "@/core/widgets/states";
import {
	canCancel,
	canSubmit,
	getRequestKindLabel,
	type RequestAction,
	type RequestKind,
} from "../models/request";
import {
	useDutyRequests,
	useLeaveRequests,
	useOvertimeRequests,
	useRequestAction,
	useTimeline,
} from "../providers/requests-queries";
import { RequestCard, type RequestCardData } from "./request-card";
import { ApprovalSteps, StatusTimeline } from "./timeline";

type Row = { label: string; value: string };

type RequestDetail = { card: RequestCardData; rows: Row[] };

/**
 * Single request detail + submit/cancel actions (mobile PRD Bag. 5.4).
 * No single-detail endpoint — data comes from the owned list.
 */
export function RequestDetailScreen({ id, kind }: { id: string; kind: RequestKind }) {
	const [notice, setNotice] = useState<NoticeProps | null>(null);
	const action = useRequestAction();
	const timeline = useTimeline(kind, id);

	const leaveQuery = useLeaveRequests();
	const overtimeQuery = useOvertimeRequests();
	const dutyQuery = useDutyRequests();

	const source = kind === "leave" ? leaveQuery : kind === "overtime" ? overtimeQuery : dutyQuery;

	let detail: RequestDetail | null = null;

	if (kind === "leave") {
		const x = leaveQuery.data?.find((i) => i.id === id);
		if (x) {
			detail = {
				card: {
					id: x.id,
					kind,
					status: x.status,
					number: x.number,
					title: x.leaveTypeName,
					range: `${formatDate(x.startDate)} – ${formatDate(x.endDate)}`,
					note: `${x.totalDays} hari${x.usesBalance ? " · memakai saldo" : ""}`,
				},
				rows: [
					{ label: "Nomor", value: x.number },
					{ label: "Jenis", value: x.leaveTypeName },
					{ label: "Tanggal", value: `${formatDate(x.startDate)} – ${formatDate(x.endDate)}` },
					{ label: "Jumlah hari", value: x.totalDays },
					{ label: "Memakai saldo", value: x.usesBalance ? "Ya" : "Tidak" },
					{ label: "Pemohon", value: x.employeeName },
				],
			};
		}
	} else if (kind === "overtime") {
		const x = overtimeQuery.data?.find((i) => i.id === id);
		if (x) {
			detail = {
				card: {
					id: x.id,
					kind,
					status: x.status,
					title: "Lembur",
					range: `${formatDate(x.date)} · ${x.startTime}–${x.endTime}`,
					note: `${x.totalHours} jam · ${x.reason}`,
				},
				rows: [
					{ label: "Tanggal", value: formatDate(x.date) },
					{ label: "Jam", value: `${x.startTime} – ${x.endTime}` },
					{ label: "Jumlah jam", value: x.totalHours },
					{ label: "Alasan", value: x.reason || "—" },
					{ label: "Pemohon", value: x.employeeName },
				],
			};
		}
	} else {
		const x = dutyQuery.data?.find((i) => i.id === id);
		if (x) {
			detail = {
				card: {
					id: x.id,
					kind,
					status: x.status,
					number: x.number,
					title: x.dutyType === "WFH" ? "WFH" : "Dinas Luar",
					range: `${formatDate(x.startDate)} – ${formatDate(x.endDate)}`,
					note: x.location ?? undefined,
				},
				rows: [
					{ label: "Nomor", value: x.number },
					{ label: "Jenis", value: x.dutyType === "WFH" ? "WFH" : "Dinas Luar" },
					{ label: "Tanggal", value: `${formatDate(x.startDate)} – ${formatDate(x.endDate)}` },
					{ label: "Lokasi", value: x.location || "—" },
					{ label: "Pemohon", value: x.employeeName },
				],
			};
		}
	}

	async function run(a: RequestAction) {
		setNotice(null);
		try {
			const result = await action.mutateAsync({ kind, id, action: a });
			setNotice({ tone: "success", title: result.message });
		} catch (error) {
			setNotice({
				tone: "danger",
				title: "Gagal memproses pengajuan",
				description: error instanceof ApiException ? error.message : "Terjadi kesalahan.",
			});
		}
	}

	function confirmCancel() {
		Alert.alert("Batalkan pengajuan?", "Pengajuan ini akan ditarik dan tidak diproses lebih lanjut.", [
			{ text: "Kembali", style: "cancel" },
			{ text: "Ya, batalkan", style: "destructive", onPress: () => void run("cancel") },
		]);
	}

	if (source.isPending) return <LoadingView label="Memuat detail pengajuan..." />;
	if (source.isError && source.data === undefined)
		return <ErrorView message="Gagal memuat detail pengajuan." onRetry={() => void source.refetch()} />;

	if (!detail) {
		return (
			<>
				<ScreenHeader title="Detail Pengajuan" subtitle={getRequestKindLabel(kind)} />
				<ErrorView message="Pengajuan tidak ditemukan di daftar terbaru." onRetry={() => void source.refetch()} />
			</>
		);
	}

	const { card, rows } = detail;

	return (
		<>
			<ScreenHeader title="Detail Pengajuan" subtitle={getRequestKindLabel(kind)} />
			<ScrollView contentContainerStyle={styles.content}>
				{notice ? <Notice {...notice} /> : null}

				<RequestCard data={card} />

				<View style={styles.panel}>
					{rows.map((b) => (
						<View key={b.label} style={styles.row}>
							<Text style={styles.rowLabel}>{b.label}</Text>
							<Text style={styles.rowValue}>{b.value}</Text>
						</View>
					))}
				</View>

				<StatusTimeline
					status={card.status}
					hasApproval={(timeline.data?.items.length ?? 0) > 0}
				/>
				{timeline.data ? <ApprovalSteps items={timeline.data.items} /> : null}

				<View style={styles.actions}>
					{canSubmit(card.status) ? (
						<AppButton
							label="Ajukan Sekarang"
							loading={action.isPending}
							onPress={() => void run("submit")}
						/>
					) : null}
					{canCancel(card.status) ? (
						<AppButton
							label="Batalkan Pengajuan"
							variant="danger"
							loading={action.isPending}
							onPress={confirmCancel}
						/>
					) : null}
				</View>
			</ScrollView>
		</>
	);
}

const styles = StyleSheet.create({
	content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },
	panel: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		backgroundColor: colors.surface,
		paddingHorizontal: spacing.md,
	},
	row: {
		flexDirection: "row",
		gap: spacing.md,
		paddingVertical: spacing.md,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
	},
	rowLabel: { width: 110, fontSize: fontSize.sm, color: colors.textMuted },
	rowValue: { flex: 1, fontSize: fontSize.sm, color: colors.text },
	actions: { gap: spacing.sm, marginTop: spacing.sm },
});
