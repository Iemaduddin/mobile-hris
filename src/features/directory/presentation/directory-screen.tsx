import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/core/theme";
import { AppTextField } from "@/core/widgets/app-text-field";
import { ScreenHeader } from "@/core/widgets/screen-header";
import { EmptyView, ErrorView } from "@/core/widgets/states";
import { ScreenSkeleton } from "@/core/widgets/skeleton";
import { useEmployees } from "../providers/directory-queries";
import type { DirectoryEmployee } from "../data/directory-api";

/**
 * Direktori Karyawan — M-HR-1. Cari nama/nomor, lihat kontak & penempatan.
 * Read-only; data sensitif (NIK/NPWP/bank/gaji) tidak dikirim API.
 */
export function DirectoryScreen() {
	const [query, setQuery] = useState("");
	const directory = useEmployees(query.trim());

	const items = directory.data?.items ?? [];

	return (
		<View style={styles.screen}>
			<ScreenHeader
				title="Direktori Karyawan"
				subtitle={
					directory.data
						? directory.data.query
							? `${items.length} hasil`
							: `${items.length} karyawan aktif`
						: undefined
				}
			/>
			<View style={styles.search}>
				<AppTextField
					label="Cari"
					placeholder="Nama atau nomor karyawan"
					value={query}
					onChangeText={setQuery}
					autoCapitalize="none"
				/>
			</View>

			{directory.isPending ? (
				<ScreenSkeleton count={4} showTitle={false} />
			) : directory.isError && directory.data === undefined ? (
				<ErrorView message="Gagal memuat direktori." onRetry={() => void directory.refetch()} />
			) : (
				<FlatList
					data={items}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.content}
					refreshControl={
						<RefreshControl
							refreshing={directory.isFetching}
							onRefresh={() => void directory.refetch()}
							tintColor={colors.primary}
						/>
					}
					ListEmptyComponent={<EmptyView message="Karyawan tidak ditemukan." />}
					renderItem={({ item }) => <EmployeeRow employee={item} />}
					ItemSeparatorComponent={() => <View style={styles.gap} />}
				/>
			)}
		</View>
	);
}

function EmployeeRow({ employee }: { employee: DirectoryEmployee }) {
	const placement = [employee.positionName, employee.unitName].filter(Boolean).join(" · ");
	const contact = [employee.email, employee.phone].filter(Boolean).join(" · ");
	return (
		<View style={styles.card}>
			<Text style={styles.name}>
				{employee.fullName}{" "}
				<Text style={styles.number}>({employee.employeeNumber})</Text>
			</Text>
			{placement ? <Text style={styles.muted}>{placement}</Text> : null}
			{contact ? <Text style={styles.muted}>{contact}</Text> : null}
			<Text style={styles.status}>{employee.status.replaceAll("_", " ")}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	search: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
	content: { padding: spacing.xl, paddingTop: 0, gap: spacing.sm, flexGrow: 1 },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: 2,
	},
	name: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
	number: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "400" },
	muted: { fontSize: fontSize.xs, color: colors.textMuted },
	status: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: "700" },
	gap: { height: spacing.sm },
});
