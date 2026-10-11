export type SlipSaya = {
	nomor: string;
	periode: string;
	gajiBersih: string;
};

export type RincianSlip = {
	kode: string;
	nama: string;
	kelompok: string;
	jumlah: number;
	keterangan: string;
};

export type SlipDetail = {
	nomor: string;
	periode: string;
	karyawanNama: string;
	nomorKaryawan: string;
	gajiPokok: string;
	totalPendapatan: string;
	totalPotongan: string;
	gajiBersih: string;
	hariHadir: number;
	hariAlpa: number;
	rincian: RincianSlip[];
};

const BULAN = [
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

const KELOMPOK_LABEL: Record<string, string> = {
	PENDAPATAN: "Pendapatan",
	TUNJANGAN: "Tunjangan",
	POTONGAN: "Potongan",
	IURAN: "Iuran (karyawan)",
};

const URUTAN_KELOMPOK = ["PENDAPATAN", "TUNJANGAN", "POTONGAN", "IURAN"];

/** "2026-09" -> "September 2026". */
export function labelPeriode(periode: string): string {
	const [tahun, bulan] = periode.split("-");
	const index = Number(bulan) - 1;
	if (!tahun || Number.isNaN(index) || index < 0 || index > 11) return periode;
	return `${BULAN[index]} ${tahun}`;
}

export function formatRupiah(value: string | number): string {
	const angka = typeof value === "string" ? Number(value) : value;
	if (!Number.isFinite(angka)) return "Rp 0";
	return `Rp ${Math.round(angka).toLocaleString("id-ID")}`;
}

export type KelompokRincian = {
	kelompok: string;
	label: string;
	items: RincianSlip[];
	subtotal: number;
};

/** Rincian dikelompokkan per kelompok (pendapatan/tunjangan/potongan/iuran). */
export function kelompokRincian(rincian: RincianSlip[]): KelompokRincian[] {
	return URUTAN_KELOMPOK.map((kelompok) => {
		const items = rincian.filter((r) => r.kelompok === kelompok);
		return {
			kelompok,
			label: KELOMPOK_LABEL[kelompok] ?? kelompok,
			items,
			subtotal: items.reduce((total, r) => total + (Number(r.jumlah) || 0), 0),
		};
	}).filter((g) => g.items.length > 0);
}
