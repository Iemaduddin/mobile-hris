import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { formatTanggal } from "@/core/util/format";
import { ApiException } from "@/core/network/api-exception";
import { AppButton } from "@/core/widgets/app-button";
import { Notice, type NoticeProps } from "@/core/widgets/notice";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { ErrorView, LoadingView } from "@/core/widgets/states";
import {
	bisaDiajukan,
	bisaDibatalkan,
	labelJenisPengajuan,
	type AksiPengajuan,
	type JenisPengajuan,
} from "../models/request";
import {
	useAksiPengajuan,
	useCutiList,
	useDinasList,
	useLemburList,
	useTimeline,
} from "../providers/requests-queries";
import { RequestCard, type KartuPengajuan } from "./request-card";
import { ApprovalSteps, StatusTimeline } from "./timeline";

type Baris = { label: string; value: string };

type DetailPengajuan = { kartu: KartuPengajuan; baris: Baris[] };

/**
 * Detail satu pengajuan + aksi ajukan/batal (PRD mobile Bag. 5.4).
 * Tidak ada endpoint detail tunggal — data diambil dari daftar milik sendiri.
 */
export function RequestDetailScreen({ id, jenis }: { id: string; jenis: JenisPengajuan }) {
	const [pesan, setPesan] = useState<NoticeProps | null>(null);
	const aksi = useAksiPengajuan();
	const timeline = useTimeline(jenis, id);

	const cutiQ = useCutiList();
	const lemburQ = useLemburList();
	const dinasQ = useDinasList();

	const sumber = jenis === "cuti" ? cutiQ : jenis === "lembur" ? lemburQ : dinasQ;

	let detail: DetailPengajuan | null = null;

	if (jenis === "cuti") {
		const x = cutiQ.data?.find((i) => i.id === id);
		if (x) {
			detail = {
				kartu: {
					id: x.id,
					jenis,
					status: x.status,
					nomor: x.nomor,
					judul: x.jenisNama,
					rentang: `${formatTanggal(x.mulai)} – ${formatTanggal(x.selesai)}`,
					keterangan: `${x.jumlahHari} hari${x.menggunakanSaldo ? " · memakai saldo" : ""}`,
				},
				baris: [
					{ label: "Nomor", value: x.nomor },
					{ label: "Jenis", value: x.jenisNama },
					{ label: "Tanggal", value: `${formatTanggal(x.mulai)} – ${formatTanggal(x.selesai)}` },
					{ label: "Jumlah hari", value: x.jumlahHari },
					{ label: "Memakai saldo", value: x.menggunakanSaldo ? "Ya" : "Tidak" },
					{ label: "Pemohon", value: x.karyawanNama },
				],
			};
		}
	} else if (jenis === "lembur") {
		const x = lemburQ.data?.find((i) => i.id === id);
		if (x) {
			detail = {
				kartu: {
					id: x.id,
					jenis,
					status: x.status,
					judul: "Lembur",
					rentang: `${formatTanggal(x.tanggal)} · ${x.jamMulai}–${x.jamSelesai}`,
					keterangan: `${x.jumlahJam} jam · ${x.alasan}`,
				},
				baris: [
					{ label: "Tanggal", value: formatTanggal(x.tanggal) },
					{ label: "Jam", value: `${x.jamMulai} – ${x.jamSelesai}` },
					{ label: "Jumlah jam", value: x.jumlahJam },
					{ label: "Alasan", value: x.alasan || "—" },
					{ label: "Pemohon", value: x.karyawanNama },
				],
			};
		}
	} else {
		const x = dinasQ.data?.find((i) => i.id === id);
		if (x) {
			detail = {
				kartu: {
					id: x.id,
					jenis,
					status: x.status,
					nomor: x.nomor,
					judul: x.jenis === "WFH" ? "WFH" : "Dinas Luar",
					rentang: `${formatTanggal(x.mulai)} – ${formatTanggal(x.selesai)}`,
					keterangan: x.lokasi ?? undefined,
				},
				baris: [
					{ label: "Nomor", value: x.nomor },
					{ label: "Jenis", value: x.jenis === "WFH" ? "WFH" : "Dinas Luar" },
					{ label: "Tanggal", value: `${formatTanggal(x.mulai)} – ${formatTanggal(x.selesai)}` },
					{ label: "Lokasi", value: x.lokasi || "—" },
					{ label: "Pemohon", value: x.karyawanNama },
				],
			};
		}
	}

	async function jalankan(a: AksiPengajuan) {
		setPesan(null);
		try {
			const hasil = await aksi.mutateAsync({ jenis, id, aksi: a });
			setPesan({ tone: "success", title: hasil.message });
		} catch (error) {
			setPesan({
				tone: "danger",
				title: "Gagal memproses pengajuan",
				description: error instanceof ApiException ? error.message : "Terjadi kesalahan.",
			});
		}
	}

	function konfirmasiBatal() {
		Alert.alert("Batalkan pengajuan?", "Pengajuan ini akan ditarik dan tidak diproses lebih lanjut.", [
			{ text: "Kembali", style: "cancel" },
			{ text: "Ya, batalkan", style: "destructive", onPress: () => void jalankan("batal") },
		]);
	}

	if (sumber.isPending) return <LoadingView label="Memuat detail pengajuan..." />;
	if (sumber.isError && sumber.data === undefined)
		return <ErrorView message="Gagal memuat detail pengajuan." onRetry={() => void sumber.refetch()} />;

	if (!detail) {
		return (
			<>
				<ScreenHeader title="Detail Pengajuan" subtitle={labelJenisPengajuan(jenis)} />
				<ErrorView message="Pengajuan tidak ditemukan di daftar terbaru." onRetry={() => void sumber.refetch()} />
			</>
		);
	}

	const { kartu, baris } = detail;

	return (
		<>
			<ScreenHeader title="Detail Pengajuan" subtitle={labelJenisPengajuan(jenis)} />
			<ScrollView contentContainerStyle={styles.content}>
				{pesan ? <Notice {...pesan} /> : null}

				<RequestCard data={kartu} />

				<View style={styles.panel}>
					{baris.map((b) => (
						<View key={b.label} style={styles.row}>
							<Text style={styles.rowLabel}>{b.label}</Text>
							<Text style={styles.rowValue}>{b.value}</Text>
						</View>
					))}
				</View>

				<StatusTimeline
					status={kartu.status}
					adaApproval={(timeline.data?.items.length ?? 0) > 0}
				/>
				{timeline.data ? <ApprovalSteps items={timeline.data.items} /> : null}

				<View style={styles.actions}>
					{bisaDiajukan(kartu.status) ? (
						<AppButton
							label="Ajukan Sekarang"
							loading={aksi.isPending}
							onPress={() => void jalankan("ajukan")}
						/>
					) : null}
					{bisaDibatalkan(kartu.status) ? (
						<AppButton
							label="Batalkan Pengajuan"
							variant="danger"
							loading={aksi.isPending}
							onPress={konfirmasiBatal}
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
