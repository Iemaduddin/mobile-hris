/**
 * Helper format tanggal & waktu.
 * Nama hari/bulan ditulis manual agar konsisten di semua runtime Hermes
 * (Intl tidak selengkap ICU di build produksi React Native).
 */

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Parse tanggal-only (`YYYY-MM-DD` atau ISO yang diawali tanggal itu)
 * sebagai waktu lokal — menghindari geser hari akibat zona UTC.
 */
export function parseTanggal(value: string | Date): Date {
	if (value instanceof Date) return value;
	const [tahun, bulan, tanggal] = value.slice(0, 10).split("-").map(Number);
	return new Date(tahun, (bulan ?? 1) - 1, tanggal ?? 1);
}

/** `YYYY-MM-DD` dari Date atau string ISO apa pun. */
export function toTanggalOnly(value: string | Date): string {
	const d = value instanceof Date ? value : parseTanggal(value);
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Geser tanggal sebanyak `delta` hari → `YYYY-MM-DD`. */
export function tambahHari(value: string | Date, delta: number): string {
	const d = parseTanggal(value);
	d.setDate(d.getDate() + delta);
	return toTanggalOnly(d);
}

/** "HH:mm" dari timestamp ISO atau Date. */
export function formatJam(value: string | Date | null | undefined): string {
	if (value == null || value === "") return "-";
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "-";
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "Sen, 5 Okt 2026" */
export function formatTanggal(value: string | Date): string {
	const d = parseTanggal(value);
	return `${HARI[d.getDay()].slice(0, 3)}, ${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`;
}

/** "5 Oktober 2026" */
export function formatTanggalPanjang(value: string | Date): string {
	const d = parseTanggal(value);
	return `${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Sen" — untuk header kolom kalender. */
export function namaHariPendek(value: string | Date): string {
	return HARI[parseTanggal(value).getDay()].slice(0, 3);
}

/** "Okt 2026" */
export function formatBulanTahun(bulan: number, tahun: number): string {
	return `${BULAN_PANJANG[bulan - 1]} ${tahun}`;
}

/** "1 j 30 m" / "45 m" / "0 m" */
export function formatDurasi(menit: number): string {
	if (menit <= 0) return "0 m";
	const jam = Math.floor(menit / 60);
	const sisa = menit % 60;
	if (jam === 0) return `${sisa} m`;
	return sisa === 0 ? `${jam} j` : `${jam} j ${sisa} m`;
}

/** Label ramah untuk status rekap harian. */
export function labelStatusRekap(status: string): string {
	switch (status) {
		case "HADIR":
			return "Hadir";
		case "TELAT":
			return "Telat";
		case "PULANG_CEPAT":
			return "Pulang Cepat";
		case "LEMBUR":
			return "Lembur";
		case "ALPA":
			return "Alpa";
		case "CUTI":
			return "Cuti";
		case "SAKIT":
			return "Sakit";
		case "IZIN":
			return "Izin";
		case "DINAS":
			return "Dinas";
		case "LIBUR":
			return "Libur";
		case "TANPA_JADWAL":
			return "Tanpa Jadwal";
		case "TERLAMBAT":
			return "Terlambat";
		default:
			return status;
	}
}

/** Label untuk tipe presensi. */
export function labelTipePresensi(tipe: string): string {
	switch (tipe) {
		case "MASUK":
			return "Masuk";
		case "KELUAR":
			return "Pulang";
		case "MULAI_ISTIRAHAT":
			return "Mulai Istirahat";
		case "SELESAI_ISTIRAHAT":
			return "Selesai Istirahat";
		case "KELUAR_KANTOR":
			return "Keluar Kantor";
		case "KEMBALI_KANTOR":
			return "Kembali Kantor";
		default:
			return tipe;
	}
}
