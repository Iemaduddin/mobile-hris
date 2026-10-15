import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { SkeletonLayar } from "@/core/widgets/skeleton";
import { formatTanggal } from "@/core/util/format";
import { ruteMobile, type NotifikasiMobile } from "../data/notifikasi-api";
import { useNotifikasi, useTandaiDibaca } from "../providers/notifikasi-queries";
import { ApiException } from "@/core/network/api-exception";

/** Layar Notifikasi mobile — daftar in-app + tandai dibaca (preferensi di Pengaturan). */
export function NotifikasiScreen({ sembunyiKembali = false }: { sembunyiKembali?: boolean }) {
	const daftar = useNotifikasi();
	const tandai = useTandaiDibaca();

	function buka(item: NotifikasiMobile) {
		if (!item.dibaca) tandai.mutate(item.id);
		const rute = ruteMobile(item);
		if (rute) router.push(rute as never);
	}

	function galat(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	if (daftar.isPending)
		return (
			<View style={styles.layar}>
				<ScreenHeader title="Notifikasi" subtitle="Memuat…" />
				<SkeletonLayar jumlah={4} judul={false} />
			</View>
		);
	if (daftar.isError && daftar.data === undefined)
		return <ErrorView message="Gagal memuat notifikasi." onRetry={() => void daftar.refetch()} />;

	const items = daftar.data?.items ?? [];

	return (
		<View style={styles.layar}>
			<ScreenHeader
				title="Notifikasi"
				subtitle={items.length > 0 ? `${items.length} pesan` : undefined}
				hideBack={sembunyiKembali}
			/>
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={daftar.isRefetching}
						onRefresh={() => void daftar.refetch()}
						tintColor={colors.primary}
					/>
				}
				ListHeaderComponent={
					<View style={styles.head}>
						<Pressable
							onPress={() => tandai.mutate("semua", { onError: (e) => Alert.alert("Gagal", galat(e)) })}
							accessibilityRole="button"
							style={styles.tandaiSemua}
						>
							<Text style={styles.tandaiSemuaLabel}>Tandai semua dibaca</Text>
						</Pressable>
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada notifikasi." />}
				renderItem={({ item }) => (
					<Pressable
						onPress={() => buka(item)}
						accessibilityRole="button"
						style={[styles.card, !item.dibaca && styles.cardBaru]}
					>
						<View style={styles.cardHead}>
							<Text style={[styles.judul, !item.dibaca && styles.judulBaru]}>{item.judul}</Text>
							{!item.dibaca ? <View style={styles.dot} /> : null}
						</View>
						<Text style={styles.isi} numberOfLines={3}>
							{item.isi}
						</Text>
						<Text style={styles.waktu}>{formatTanggal(item.waktu)}</Text>
					</Pressable>
				)}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	layar: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	head: { gap: spacing.md, marginBottom: spacing.sm },
	tandaiSemua: { alignSelf: "flex-end", paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
	tandaiSemuaLabel: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "700" },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardBaru: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	judul: { flex: 1, fontSize: fontSize.sm, color: colors.text },
	judulBaru: { fontWeight: "700" },
	dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
	isi: { fontSize: fontSize.sm, color: colors.textMuted },
	waktu: { fontSize: fontSize.xs, color: colors.textMuted },
	gap: { height: spacing.sm },
});
