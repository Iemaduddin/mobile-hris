export type PenempatanProfil = {
	posisi: string | null;
	unitOrganisasi: string | null;
	tanggalEfektif: string | null;
	tanggalBerakhir: string | null;
	lokasi: {
		nama: string;
		alamat: string | null;
		kota: string | null;
		provinsi: string | null;
		kodePos: string | null;
		latitude: number | null;
		longitude: number | null;
		radiusMeter: number | null;
	} | null;
};

export type Profil = {
	nomorKaryawan: string;
	namaLengkap: string;
	gender: string;
	tanggalLahir: string | null;
	/** Sudah di-mask oleh server (mis. 3273••••••1234) sesuai PRD Bag. 8. */
	nik: string | null;
	npwp: string | null;
	/** Path berkas foto (dokumen FOTO terakhir) — null bila belum ada. */
	fotoUrl?: string | null;
	telepon: string | null;
	email: string | null;
	alamat: string | null;
	status: string;
	tanggalMasuk: string;
	tanggalResign: string | null;
	role: string | null;
	atasanLangsung: {
		namaLengkap: string;
		nomorKaryawan: string;
		posisi: string | null;
	} | null;
	penempatan: PenempatanProfil | null;
	kontrak: {
		nomorKontrak: string;
		jenisKontrak: string;
		tanggalMulai: string | null;
		tanggalSelesai: string | null;
		status: string;
	} | null;
};

const LABEL_GENDER: Record<string, string> = {
	LAKI_LAKI: "Laki-laki",
	PEREMPUAN: "Perempuan",
};

const LABEL_KONTRAK: Record<string, string> = {
	PKWT: "PKWT (kontrak terbatas)",
	PKWTT: "PKWTT (tetap)",
	MAGANG: "Magang",
	FREELANCE: "Freelance",
	OUTSOURCING: "Outsourcing",
};

const LABEL_STATUS_KONTRAK: Record<string, string> = {
	DRAFT: "Draf",
	AKTIF: "Aktif",
	AKAN_BERAKHIR: "Akan berakhir",
	BERAKHIR: "Berakhir",
	DIBATALKAN: "Dibatalkan",
};

export function labelGender(gender: string): string {
	return LABEL_GENDER[gender] ?? gender;
}

export function labelJenisKontrak(jenis: string): string {
	return LABEL_KONTRAK[jenis] ?? jenis;
}

export function labelStatusKontrak(status: string): string {
	return LABEL_STATUS_KONTRAK[status] ?? status;
}

/** Inisial untuk avatar (maks. 2 huruf pertama tiap kata). */
export function inisial(nama: string): string {
	return nama
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((kata) => kata[0]?.toUpperCase() ?? "")
		.join("");
}
