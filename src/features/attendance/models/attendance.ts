/** Kontrak data presensi — mencerminkan `/api/v1/attendance[...]` (PRD mobile Bag. 5.3). */

export const TIPE_PRESENSI = [
	"MASUK",
	"KELUAR",
	"MULAI_ISTIRAHAT",
	"SELESAI_ISTIRAHAT",
	"KELUAR_KANTOR",
	"KEMBALI_KANTOR",
] as const;

export type TipePresensi = (typeof TIPE_PRESENSI)[number];

export type EventHariIni = {
	tipe: TipePresensi;
	waktu: string;
	sumber: string;
	/** `null` = lokasi tidak dinilai (tanpa GPS / lokasi tanpa radius). */
	diLuarRadius: boolean | null;
	isMocked: boolean;
};

/**
 * Respons `GET /api/v1/attendance`.
 * Saat tidak ada jadwal, backend hanya mengirim `{status: "TANPA_JADWAL", rekap: null}`.
 */
export type StatusPresensiHariIni = {
	status: string;
	rekap?: null;
	telatMenit?: number | null;
	masukAktual?: string | null;
	keluarAktual?: string | null;
	events?: EventHariIni[];
};

export type InputPresensi = {
	tipe: TipePresensi;
	/** Identitas perangkat untuk audit (PRD mobile Bag. 7-B5). */
	deviceId?: string;
	deviceName?: string;
	platform?: string;
	latitude?: number;
	longitude?: number;
	isMocked?: boolean;
	lokasiKerjaId?: string;
};

export type HasilClock = {
	message: string;
	tipe: TipePresensi;
	waktu: string;
	/** `true` = di luar radius, `false` = di dalam, `null` = tidak dinilai. */
	diLuarRadius: boolean | null;
	isMocked: boolean;
	jarakMeter: number | null;
};

export type RekapHarian = {
	id: number;
	karyawanId: string;
	karyawanNama: string;
	nomorKaryawan: string;
	tanggal: string;
	status: string;
	telatMenit: number;
	pulangCepatMenit: number;
	lemburMenit: number;
	masukAktual: string | null;
	keluarAktual: string | null;
};

export type RiwayatBulanan = {
	tahun: number;
	bulan: number;
	items: RekapHarian[];
};

export type EventDetail = {
	tipe: TipePresensi;
	waktu: string;
	sumber: string;
	status: string;
	/** `null` = lokasi tidak dinilai (tanpa GPS / lokasi tanpa radius). */
	diLuarRadius: boolean | null;
	isMocked: boolean;
	catatan: string | null;
};

/** Respons `GET /api/v1/attendance/day?tanggal=YYYY-MM-DD`. */
export type DetailHari = {
	/** `YYYY-MM-DD` */
	tanggal: string;
	status: string;
	telatMenit: number | null;
	pulangCepatMenit: number | null;
	lemburMenit: number | null;
	masukAktual: string | null;
	keluarAktual: string | null;
	events: EventDetail[];
};
