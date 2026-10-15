import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { formatTanggalPanjang } from "@/core/util/format";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { AvatarFoto } from "@/core/widgets/avatar-foto";
import { ErrorView } from "@/core/widgets/states";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import {
	inisial,
	labelGender,
	labelJenisKontrak,
	labelStatusKontrak,
	type Profil,
} from "../models/profile";
import { useProfil } from "../providers/profile-queries";

type Baris = { label: string; nilai: string | null };

/**
 * Profil Saya (PRD mobile Bag. 5.6) — read-only.
 * NIK/NPWP sudah di-mask server-side, jadi tidak perlu disamarkan lagi di sini.
 */
export function ProfileScreen() {
	const profil = useProfil();

	if (profil.isPending)
		return (
			<View style={styles.wrap}>
				<ScreenHeader title="Profil Saya" subtitle="Memuat…" />
				<SkeletonLayar jumlah={3} judul={false} />
			</View>
		);
	if (profil.isError || !profil.data)
		return (
			<View style={styles.wrap}>
				<ScreenHeader title="Profil Saya" />
				<ErrorView message="Gagal memuat profil." onRetry={() => void profil.refetch()} />
			</View>
		);

	return (
		<View style={styles.wrap}>
			<ScreenHeader title="Profil Saya" />
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={profil.isFetching}
						onRefresh={() => void profil.refetch()}
						tintColor={colors.primary}
					/>
				}
			>
				<Kepala profil={profil.data} />

				<Bagian judul="Identitas">
					{identitasBaris(profil.data).map((r) => (
						<BarisProfil key={r.label} label={r.label} nilai={r.nilai} />
					))}
				</Bagian>

				<Bagian judul="Kontak">
					{kontakBaris(profil.data).map((r) => (
						<BarisProfil key={r.label} label={r.label} nilai={r.nilai} />
					))}
				</Bagian>

				<Bagian judul="Penempatan Aktif">
					{penempatanBaris(profil.data).map((r) => (
						<BarisProfil key={r.label} label={r.label} nilai={r.nilai} />
					))}
				</Bagian>

				<Bagian judul="Kontrak Kerja">
					{kontrakBaris(profil.data).map((r) => (
						<BarisProfil key={r.label} label={r.label} nilai={r.nilai} />
					))}
				</Bagian>
			</ScrollView>
		</View>
	);
}

function Kepala({ profil }: { profil: Profil }) {
	return (
		<View style={styles.kepala}>
			<AvatarFoto nama={profil.namaLengkap} inisial={inisial(profil.namaLengkap)} fotoPath={profil.fotoUrl} ukuran={72} />
			<Text style={styles.nama}>{profil.namaLengkap}</Text>
			<Text style={styles.nomor}>{profil.nomorKaryawan}</Text>
			<StatusChip
				label={profil.status.replace(/_/g, " ")}
				tone={profil.status === "AKTIF" ? "success" : profil.status === "PROBASI" ? "info" : "muted"}
			/>
		</View>
	);
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
	return (
		<View style={styles.bagian}>
			<Text style={styles.bagianJudul}>{judul}</Text>
			<View style={styles.card}>{children}</View>
		</View>
	);
}

function BarisProfil({ label, nilai }: { label: string; nilai: string | null }) {
	return (
		<View style={styles.baris}>
			<Text style={styles.barisLabel}>{label}</Text>
			<Text style={[styles.barisNilai, !nilai && styles.barisKosong]} numberOfLines={2}>
				{nilai && nilai.trim().length > 0 ? nilai : "—"}
			</Text>
		</View>
	);
}

function identitasBaris(p: Profil): Baris[] {
	return [
		{ label: "Jenis kelamin", nilai: labelGender(p.gender) },
		{ label: "Tanggal lahir", nilai: p.tanggalLahir ? formatTanggalPanjang(p.tanggalLahir) : null },
		{ label: "NIK", nilai: p.nik },
		{ label: "NPWP", nilai: p.npwp },
		{ label: "Tanggal masuk", nilai: formatTanggalPanjang(p.tanggalMasuk) },
		{ label: "Tanggal resign", nilai: p.tanggalResign ? formatTanggalPanjang(p.tanggalResign) : null },
		{
			label: "Atasan langsung",
			nilai: p.atasanLangsung
				? `${p.atasanLangsung.namaLengkap} (${p.atasanLangsung.nomorKaryawan})`
				: null,
		},
	];
}

function kontakBaris(p: Profil): Baris[] {
	return [
		{ label: "Email", nilai: p.email },
		{ label: "Telepon", nilai: p.telepon },
		{ label: "Alamat", nilai: p.alamat },
	];
}

function penempatanBaris(p: Profil): Baris[] {
	const lokasi = p.penempatan?.lokasi ?? null;
	const alamatLokasi = lokasi
		? [lokasi.alamat, lokasi.kota, lokasi.provinsi].filter(Boolean).join(", ")
		: null;

	return [
		{ label: "Posisi", nilai: p.penempatan?.posisi ?? null },
		{ label: "Unit organisasi", nilai: p.penempatan?.unitOrganisasi ?? null },
		{
			label: "Berlaku sejak",
			nilai: p.penempatan?.tanggalEfektif ? formatTanggalPanjang(p.penempatan.tanggalEfektif) : null,
		},
		{ label: "Lokasi kerja", nilai: lokasi?.nama ?? null },
		{ label: "Alamat lokasi", nilai: alamatLokasi },
		{ label: "Radius absensi", nilai: lokasi?.radiusMeter ? `${lokasi.radiusMeter} m` : null },
	];
}

function kontrakBaris(p: Profil): Baris[] {
	if (!p.kontrak) return [{ label: "Kontrak", nilai: null }];
	return [
		{ label: "Nomor kontrak", nilai: p.kontrak.nomorKontrak },
		{ label: "Jenis", nilai: labelJenisKontrak(p.kontrak.jenisKontrak) },
		{ label: "Status", nilai: labelStatusKontrak(p.kontrak.status) },
		{
			label: "Mulai",
			nilai: p.kontrak.tanggalMulai ? formatTanggalPanjang(p.kontrak.tanggalMulai) : null,
		},
		{
			label: "Selesai",
			nilai: p.kontrak.tanggalSelesai ? formatTanggalPanjang(p.kontrak.tanggalSelesai) : "Tidak terbatas",
		},
	];
}

const styles = StyleSheet.create({
	wrap: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },

	kepala: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
	nama: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text, textAlign: "center" },
	nomor: { fontSize: fontSize.sm, color: colors.textMuted },

	bagian: { gap: spacing.xs },
	bagianJudul: {
		fontSize: fontSize.xs,
		fontWeight: "700",
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		paddingHorizontal: spacing.md,
	},
	baris: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		paddingVertical: spacing.sm,
		minHeight: 40,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	barisLabel: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
	barisNilai: {
		fontSize: fontSize.sm,
		color: colors.text,
		textAlign: "right",
		flex: 1.2,
	},
	barisKosong: { color: colors.disabled },
});
