import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { formatLongDate } from "@/core/util/format";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { AvatarPhoto } from "@/core/widgets/avatar-foto";
import { ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import {
	getInitials,
	getGenderLabel,
	getContractTypeLabel,
	getContractStatusLabel,
	type Profile,
} from "../models/profile";
import { useProfile } from "../providers/profile-queries";

type Row = { label: string; value: string | null };

/**
 * My Profile (mobile PRD Bag. 5.6) — read-only.
 * NIK/NPWP arrive server-masked, no further redaction needed here.
 */
export function ProfileScreen() {
	const profile = useProfile();

	if (profile.isPending)
		return (
			<View style={styles.wrap}>
				<ScreenHeader title="Profil Saya" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (profile.isError || !profile.data)
		return (
			<View style={styles.wrap}>
				<ScreenHeader title="Profil Saya" />
				<ErrorView message="Gagal memuat profil." onRetry={() => void profile.refetch()} />
			</View>
		);

	return (
		<View style={styles.wrap}>
			<ScreenHeader title="Profil Saya" />
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={profile.isFetching}
						onRefresh={() => void profile.refetch()}
						tintColor={colors.primary}
					/>
				}
			>
				<Header profile={profile.data} />

				<Section title="Identitas">
					{identityRows(profile.data).map((r) => (
						<ProfileRow key={r.label} label={r.label} value={r.value} />
					))}
				</Section>

				<Section title="Kontak">
					{contactRows(profile.data).map((r) => (
						<ProfileRow key={r.label} label={r.label} value={r.value} />
					))}
				</Section>

				<Section title="Penempatan Aktif">
					{placementRows(profile.data).map((r) => (
						<ProfileRow key={r.label} label={r.label} value={r.value} />
					))}
				</Section>

				<Section title="Kontrak Kerja">
					{contractRows(profile.data).map((r) => (
						<ProfileRow key={r.label} label={r.label} value={r.value} />
					))}
				</Section>
			</ScrollView>
		</View>
	);
}

function Header({ profile }: { profile: Profile }) {
	return (
		<View style={styles.header}>
			<AvatarPhoto name={profile.fullName} initials={getInitials(profile.fullName)} photoPath={profile.photoUrl} size={72} />
			<Text style={styles.name}>{profile.fullName}</Text>
			<Text style={styles.number}>{profile.employeeNumber}</Text>
			<StatusChip
				label={profile.status.replace(/_/g, " ")}
				tone={profile.status === "AKTIF" ? "success" : profile.status === "PROBASI" ? "info" : "muted"}
			/>
		</View>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			<View style={styles.card}>{children}</View>
		</View>
	);
}

function ProfileRow({ label, value }: { label: string; value: string | null }) {
	return (
		<View style={styles.row}>
			<Text style={styles.rowLabel}>{label}</Text>
			<Text style={[styles.rowValue, !value && styles.rowEmpty]} numberOfLines={2}>
				{value && value.trim().length > 0 ? value : "—"}
			</Text>
		</View>
	);
}

function identityRows(p: Profile): Row[] {
	return [
		{ label: "Jenis kelamin", value: getGenderLabel(p.gender) },
		{ label: "Tanggal lahir", value: p.birthDate ? formatLongDate(p.birthDate) : null },
		{ label: "NIK", value: p.nik },
		{ label: "NPWP", value: p.npwp },
		{ label: "Tanggal masuk", value: formatLongDate(p.joinDate) },
		{ label: "Tanggal resign", value: p.resignDate ? formatLongDate(p.resignDate) : null },
		{
			label: "Atasan langsung",
			value: p.directManager
				? `${p.directManager.fullName} (${p.directManager.employeeNumber})`
				: null,
		},
	];
}

function contactRows(p: Profile): Row[] {
	return [
		{ label: "Email", value: p.email },
		{ label: "Telepon", value: p.phone },
		{ label: "Alamat", value: p.address },
	];
}

function placementRows(p: Profile): Row[] {
	const site = p.placement?.location ?? null;
	const siteAddress = site
		? [site.address, site.city, site.province].filter(Boolean).join(", ")
		: null;

	return [
		{ label: "Posisi", value: p.placement?.position ?? null },
		{ label: "Unit organisasi", value: p.placement?.orgUnit ?? null },
		{
			label: "Berlaku sejak",
			value: p.placement?.effectiveDate ? formatLongDate(p.placement.effectiveDate) : null,
		},
		{ label: "Lokasi kerja", value: site?.name ?? null },
		{ label: "Alamat lokasi", value: siteAddress },
		{ label: "Radius absensi", value: site?.radiusMeters ? `${site.radiusMeters} m` : null },
	];
}

function contractRows(p: Profile): Row[] {
	if (!p.contract) return [{ label: "Kontrak", value: null }];
	return [
		{ label: "Nomor kontrak", value: p.contract.contractNumber },
		{ label: "Jenis", value: getContractTypeLabel(p.contract.contractType) },
		{ label: "Status", value: getContractStatusLabel(p.contract.status) },
		{
			label: "Mulai",
			value: p.contract.startDate ? formatLongDate(p.contract.startDate) : null,
		},
		{
			label: "Selesai",
			value: p.contract.endDate ? formatLongDate(p.contract.endDate) : "Tidak terbatas",
		},
	];
}

const styles = StyleSheet.create({
	wrap: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },

	header: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
	name: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text, textAlign: "center" },
	number: { fontSize: fontSize.sm, color: colors.textMuted },

	section: { gap: spacing.xs },
	sectionTitle: {
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
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
		paddingVertical: spacing.sm,
		minHeight: 40,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	rowLabel: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
	rowValue: {
		fontSize: fontSize.sm,
		color: colors.text,
		textAlign: "right",
		flex: 1.2,
	},
	rowEmpty: { color: colors.disabled },
});
