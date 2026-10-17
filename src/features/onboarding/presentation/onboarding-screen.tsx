import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { StatusChip } from "@/core/widgets/status-chip";
import { ApiException } from "@/core/network/api-exception";
import { formatDate } from "@/core/util/format";
import { type MyOnboarding, type OnboardingChecklistItem } from "../data/onboarding-api";
import {
	getChecklistStatusLabel,
	getChecklistStatusTone,
	getOnboardingStatusLabel,
	getOnboardingStatusTone,
} from "../models/onboarding";
import { useMyOnboarding, useOnboardingDetail, useToggleChecklistItem } from "../providers/onboarding-queries";

/**
 * Employee onboarding checklist — M-ESS-7. Self tick-off only; item verification
 * (and closing the onboarding) stays on the manager/HR web screens.
 */

function getErrorMessage(error: unknown): string {
	return error instanceof ApiException ? error.message : "Operasi gagal. Coba lagi.";
}

function Progress({ percent }: { percent: number }) {
	return (
		<View style={styles.progressRow}>
			<View style={styles.progressTrack}>
				<View style={[styles.progressFill, { width: `${percent}%` }]} />
			</View>
			<Text style={styles.percentText}>{percent}%</Text>
		</View>
	);
}

export function OnboardingListScreen() {
	const list = useMyOnboarding();

	if (list.isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Onboarding" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (list.isError && list.data === undefined)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Onboarding" />
				<ErrorView message="Gagal memuat onboarding." onRetry={() => void list.refetch()} />
			</View>
		);

	const items = list.data ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader
				title="Onboarding"
				subtitle={items.length > 0 ? `${items.length} onboarding` : undefined}
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
				ListEmptyComponent={<EmptyView message="Belum ada onboarding untukmu." />}
				renderItem={({ item }) => <OnboardingCard data={item} />}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

function OnboardingCard({ data }: { data: MyOnboarding }) {
	return (
		<Pressable
			onPress={() => router.push({ pathname: "/onboarding/detail", params: { id: data.id } })}
			accessibilityRole="button"
			accessibilityLabel={`Buka checklist ${data.templateName ?? data.number}`}
			style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
		>
			<View style={styles.cardHead}>
				<Text style={styles.number} numberOfLines={1}>
					{data.number}
				</Text>
				<StatusChip
					label={getOnboardingStatusLabel(data.status)}
					tone={getOnboardingStatusTone(data.status)}
				/>
			</View>
			<Text style={styles.template} numberOfLines={1}>
				{data.templateName ?? "Onboarding kustom"}
			</Text>
			<Progress percent={data.percent} />
			<Text style={styles.meta}>
				Wajib {data.requiredDone}
				{data.targetDate ? ` · Target ${formatDate(data.targetDate)}` : ""}
			</Text>
		</Pressable>
	);
}

export function OnboardingDetailScreen({ id }: { id: string }) {
	const detail = useOnboardingDetail(id);

	if (detail.isPending)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Checklist Onboarding" subtitle="Memuat…" />
				<ScreenSkeleton count={3} showTitle={false} />
			</View>
		);
	if (detail.isError && detail.data === undefined)
		return (
			<View style={styles.screen}>
				<ScreenHeader title="Checklist Onboarding" />
				<ErrorView message="Gagal memuat checklist onboarding." onRetry={() => void detail.refetch()} />
			</View>
		);

	const data = detail.data;
	if (!data) return null;

	return (
		<View style={styles.screen}>
			<ScreenHeader
				title={data.templateName ?? "Checklist Onboarding"}
				subtitle={data.employeeName}
			/>
			<FlatList
				data={data.items}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={detail.isRefetching}
						onRefresh={() => void detail.refetch()}
						tintColor={colors.primary}
					/>
				}
				ListHeaderComponent={
					<View style={styles.card}>
						<View style={styles.cardHead}>
							<Text style={styles.template} numberOfLines={1}>
								{data.templateName ?? "Onboarding kustom"}
							</Text>
							<StatusChip
								label={getOnboardingStatusLabel(data.status)}
								tone={getOnboardingStatusTone(data.status)}
							/>
						</View>
						<Progress percent={data.percent} />
						<Text style={styles.meta}>
							Mulai {formatDate(data.startDate)}
							{data.targetDate ? ` · Target ${formatDate(data.targetDate)}` : ""}
						</Text>
						<Text style={styles.hint}>Centang yang sudah selesai — atasan/HR akan memverifikasi.</Text>
					</View>
				}
				ListEmptyComponent={<EmptyView message="Belum ada tugas pada checklist ini." />}
				renderItem={({ item }) => <ChecklistRow item={item} editable={data.status === "BERJALAN"} />}
				ItemSeparatorComponent={() => <View style={styles.gap} />}
			/>
		</View>
	);
}

function ChecklistRow({ item, editable }: { item: OnboardingChecklistItem; editable: boolean }) {
	const toggle = useToggleChecklistItem();
	const checked = item.status !== "BELUM";
	const locked = item.status === "TERVERIFIKASI";
	const disabled = !editable || toggle.isPending;

	function onPress() {
		if (locked) {
			Alert.alert("Terverifikasi", "Sudah terverifikasi (hubungi HR untuk membuka).");
			return;
		}
		if (disabled) return;
		toggle.mutate(
			{ itemId: item.id, action: checked ? "undo" : "done" },
			{ onError: (err) => Alert.alert("Gagal", getErrorMessage(err)) },
		);
	}

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="checkbox"
			accessibilityState={{ checked, disabled }}
			accessibilityLabel={item.title}
			style={({ pressed }) => [
				styles.row,
				pressed && !disabled && styles.rowPressed,
				disabled && styles.rowDisabled,
			]}
		>
			<View style={[styles.checkbox, checked && styles.checkboxOn]}>
				{checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
			</View>
			<View style={styles.rowBody}>
				<Text style={[styles.rowTitle, checked && styles.rowTitleDone]} numberOfLines={2}>
					{item.title}
				</Text>
				<Text style={styles.meta}>
					{item.category}
					{item.required ? " · Wajib" : ""}
				</Text>
				{item.note ? <Text style={styles.note}>{item.note}</Text> : null}
			</View>
			<StatusChip
				label={getChecklistStatusLabel(item.status)}
				tone={getChecklistStatusTone(item.status)}
			/>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1 },
	gap: { height: spacing.sm },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.xs,
	},
	cardPressed: { backgroundColor: colors.backgroundAlt },
	cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
	number: { flex: 1, fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
	template: { flex: 1, fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
	progressTrack: {
		flex: 1,
		height: 8,
		borderRadius: radius.sm,
		backgroundColor: colors.backgroundAlt,
		overflow: "hidden",
	},
	progressFill: { height: "100%", borderRadius: radius.sm, backgroundColor: colors.primary },
	percentText: { fontSize: fontSize.xs, fontWeight: "700", color: colors.text },
	meta: { fontSize: fontSize.xs, color: colors.textMuted },
	hint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		minHeight: TOUCH_MIN + 8,
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
	},
	rowPressed: { backgroundColor: colors.backgroundAlt },
	rowDisabled: { opacity: 0.6 },
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: radius.sm,
		borderWidth: 1.5,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.surface,
	},
	checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
	checkboxMark: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: "700" },
	rowBody: { flex: 1, gap: 2 },
	rowTitle: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
	rowTitleDone: { color: colors.textMuted },
	note: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: "italic" },
});
