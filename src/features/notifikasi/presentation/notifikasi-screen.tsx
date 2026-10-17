import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { formatDate } from "@/core/util/format";
import { mobileRoute, type MobileNotification } from "../data/notifikasi-api";
import { useMarkAsRead, useNotifications } from "../providers/notifikasi-queries";
import { ApiException } from "@/core/network/api-exception";

/** Mobile Notifications screen — in-app list + mark as read (preferences live in Settings). */
export function NotifikasiScreen({ hideBack = false }: { hideBack?: boolean }) {
	const list = useNotifications();
	const markRead = useMarkAsRead();

	function open(item: MobileNotification) {
		if (!item.isRead) markRead.mutate(item.id);
		const route = mobileRoute(item);
		if (route) router.push(route as never);
	}

	function getErrorMessage(error: unknown): string {
		return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
	}

	if (list.isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Notifikasi" subtitle="Memuat…" />
				<ScreenSkeleton count={4} showTitle={false} />
			</View>
		);
	if (list.isError && list.data === undefined)
		return <ErrorView message="Gagal memuat notifikasi." onRetry={() => void list.refetch()} />;

	const items = list.data?.items ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader
				title="Notifikasi"
				subtitle={items.length > 0 ? `${items.length} pesan` : undefined}
				hideBack={hideBack}
			/>
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={list.isRefetching}
						onRefresh={() => void list.refetch()}
						tintColor={colors.primary}
					/>
				}
				ListHeaderComponent={
					<View style={styles.head}>
						<Pressable
							onPress={() => markRead.mutate("all", { onError: (e) => Alert.alert("Gagal", getErrorMessage(e)) })}
							accessibilityRole="button"
							style={styles.markAll}
						>
							<Text style={styles.markAllLabel}>Tandai semua dibaca</Text>
						</Pressable>
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada notifikasi." />}
				renderItem={({ item }) => (
					<Pressable
						onPress={() => open(item)}
						accessibilityRole="button"
						style={[styles.card, !item.isRead && styles.cardUnread]}
					>
						<View style={styles.cardHead}>
							<Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
							{!item.isRead ? <View style={styles.dot} /> : null}
						</View>
						<Text style={styles.body} numberOfLines={3}>
							{item.body}
						</Text>
						<Text style={styles.time}>{formatDate(item.time)}</Text>
					</Pressable>
				)}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	head: { gap: spacing.md, marginBottom: spacing.sm },
	markAll: { alignSelf: "flex-end", paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
	markAllLabel: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "700" },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardUnread: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	title: { flex: 1, fontSize: fontSize.sm, color: colors.text },
	titleUnread: { fontWeight: "700" },
	dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
	body: { fontSize: fontSize.sm, color: colors.textMuted },
	time: { fontSize: fontSize.xs, color: colors.textMuted },
	gap: { height: spacing.sm },
});
