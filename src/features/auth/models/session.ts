/** Data sesi hasil login dan `/api/v1/me`. */

export type SessionUser = {
	id: string;
	name?: string | null;
	email?: string | null;
	role?: string | null;
};

/** Lokasi kerja penempatan aktif — dipakai untuk pratinjau radius presensi. */
export type LokasiKerjaSaya = {
	id: string;
	nama: string;
	latitude: number | null;
	longitude: number | null;
	radiusMeter: number | null;
};

export type PenempatanAktif = {
	posisi?: { nama: string } | null;
	unitOrganisasi?: { nama: string } | null;
	lokasiKerja?: LokasiKerjaSaya | null;
};

export type SessionKaryawan = {
	id: string;
	nomorKaryawan: string;
	namaLengkap: string;
	status: string;
	/** Path berkas foto (dokumen FOTO terakhir) — null bila belum ada. */
	fotoUrl?: string | null;
	posisiKaryawan?: PenempatanAktif[];
};

export type MeResponse = {
	user: SessionUser | null;
	karyawan: SessionKaryawan | null;
};

export type LoginResponse = {
	token?: string;
	user?: SessionUser;
};

/** Lokasi kerja acuan presensi dari penempatan aktif (`null` bila belum ada). */
export function lokasiKerjaSaya(karyawan: SessionKaryawan | null): LokasiKerjaSaya | null {
	return karyawan?.posisiKaryawan?.[0]?.lokasiKerja ?? null;
}

/** Label penempatan aktif, contoh: "Staf · HR & GA". */
export function labelPenempatan(karyawan: SessionKaryawan | null): string | null {
	const penempatan = karyawan?.posisiKaryawan?.[0];
	const posisi = penempatan?.posisi?.nama;
	const unit = penempatan?.unitOrganisasi?.nama;
	if (!posisi && !unit) return null;
	return [posisi, unit].filter(Boolean).join(" · ");
}
