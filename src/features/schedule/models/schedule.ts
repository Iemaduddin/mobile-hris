/** Kontrak `GET /api/v1/schedule` — PRD mobile Bag. 5.3.D (read-only). */

export type RosterShift = {
	/** `YYYY-MM-DD` */
	tanggal: string;
	kode: string;
	nama: string;
	/** `HH:mm` */
	jamMasuk: string | null;
	/** `HH:mm` */
	jamKeluar: string | null;
	/** `true` = shift melewati tengah malam (mis. 23:00–07:00). */
	lintasHari: boolean;
};

export type PenugasanKalender = {
	kalender: string;
	/** `YYYY-MM-DD` */
	mulai: string;
	/** `YYYY-MM-DD` | null (null = masih berjalan) */
	selesai: string | null;
};

export type JadwalSaya = {
	roster: RosterShift[];
	penugasan: PenugasanKalender[];
};
