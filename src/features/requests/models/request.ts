/** Kontrak data pengajuan — PRD mobile Bag. 5.4 & Bag. 6 (no.10-14). */

export type JenisPengajuan = "cuti" | "lembur" | "dinas";

export type StatusPengajuan =
	| "DRAFT"
	| "DIAJUKAN"
	| "MENUNGGU_APPROVAL"
	| "DISETUJUI"
	| "DITOLAK"
	| "DIBATALKAN"
	| "SELESAI";

export type AksiPengajuan = "ajukan" | "batal";

export type JenisKetidakhadiran = {
	id: number;
	kode: string;
	nama: string;
	kategori: "CUTI" | "IZIN";
	menggunakanSaldo: boolean;
	jatahTahunan: string | null;
	wajibLampiran: boolean;
	isActive: boolean;
};

export type SaldoCuti = {
	id: number;
	karyawanId: string;
	karyawanNama: string;
	jenisNama: string;
	tahun: number;
	saldoAwal: string;
	saldoAkhir: string;
};

export type PengajuanCuti = {
	id: string;
	nomor: string;
	karyawanId: string;
	karyawanNama: string;
	jenisNama: string;
	menggunakanSaldo: boolean;
	mulai: string;
	selesai: string;
	jumlahHari: string;
	status: string;
};

export type PengajuanLembur = {
	id: string;
	karyawanId: string;
	karyawanNama: string;
	tanggal: string;
	jamMulai: string;
	jamSelesai: string;
	jumlahJam: string;
	alasan: string;
	status: string;
};

export type PengajuanDinas = {
	id: string;
	nomor: string;
	karyawanId: string;
	karyawanNama: string;
	jenis: string;
	mulai: string;
	selesai: string;
	lokasi: string | null;
	status: string;
};

export type HasilAksiPengajuan = { success: boolean; message: string; id?: string };

/** Filter status yang ditawarkan di tab Pengajuan. */
export const FILTER_STATUS = [
	{ value: "", label: "Semua" },
	{ value: "DRAFT", label: "Draf" },
	{ value: "DIAJUKAN", label: "Diajukan" },
	{ value: "DISETUJUI", label: "Disetujui" },
	{ value: "DITOLAK", label: "Ditolak" },
] as const;

export const daftarJenisPengajuan: readonly JenisPengajuan[] = ["cuti", "lembur", "dinas"];

export function labelStatusPengajuan(status: string): string {
	switch (status) {
		case "DRAFT":
			return "Draf";
		case "DIAJUKAN":
			return "Diajukan";
		case "MENUNGGU_APPROVAL":
			return "Menunggu Approval";
		case "DISETUJUI":
			return "Disetujui";
		case "DITOLAK":
			return "Ditolak";
		case "DIBATALKAN":
			return "Dibatalkan";
		case "SELESAI":
			return "Selesai";
		default:
			return status;
	}
}

export type TonePengajuan = "info" | "success" | "warning" | "danger";

export function toneStatusPengajuan(status: string): TonePengajuan {
	switch (status) {
		case "DISETUJUI":
		case "SELESAI":
			return "success";
		case "DITOLAK":
		case "DIBATALKAN":
			return "danger";
		case "DIAJUKAN":
		case "MENUNGGU_APPROVAL":
			return "warning";
		default:
			return "info";
	}
}

export function labelJenisPengajuan(jenis: JenisPengajuan): string {
	if (jenis === "cuti") return "Cuti";
	if (jenis === "lembur") return "Lembur";
	return "Dinas/WFH";
}

/** Masih berupa draf — bisa diajukan maupun dibatalkan. */
export function bisaDiajukan(status: string): boolean {
	return status === "DRAFT";
}

/** Pemohon masih boleh menarik pengajuan — PRD mobile Bag. 5.4: hanya DRAFT/DIAJUKAN. */
export function bisaDibatalkan(status: string): boolean {
	return status === "DRAFT" || status === "DIAJUKAN";
}
