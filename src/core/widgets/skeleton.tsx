import { useEffect, useMemo } from "react";
import { Animated, StyleSheet, View, type DimensionValue, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/core/theme";

/**
 * Skeleton loading (UX-4): blok abu berdenyut sebagai placeholder konten,
 * menggantikan spinner fullscreen agar transisi antar-layar terasa instan.
 */
export function Skeleton({
	lebar = "100%",
	tinggi = 16,
	gaya,
}: {
	lebar?: DimensionValue;
	tinggi?: number;
	gaya?: ViewStyle;
}) {
	const denyut = useMemo(() => new Animated.Value(0.35), []);

	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(denyut, { toValue: 1, duration: 750, useNativeDriver: true }),
				Animated.timing(denyut, { toValue: 0.35, duration: 750, useNativeDriver: true }),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [denyut]);

	return <Animated.View style={[styles.blok, { width: lebar, height: tinggi, opacity: denyut }, gaya]} />;
}

/** Rangka satu kartu daftar (judul + 2 baris). */
export function SkeletonKartu({ kunci }: { kunci?: string }) {
	return (
		<View key={kunci} style={styles.kartu}>
			<Skeleton lebar="55%" tinggi={18} />
			<Skeleton lebar="90%" />
			<Skeleton lebar="70%" />
		</View>
	);
}

/** Layar skeleton: judul + N kartu — pengganti LoadingView fullscreen. */
export function SkeletonLayar({ jumlah = 4, judul = true }: { jumlah?: number; judul?: boolean }) {
	return (
		<View style={styles.layar}>
			{judul ? <Skeleton lebar="45%" tinggi={24} /> : null}
			{Array.from({ length: jumlah }, (_, i) => (
				<SkeletonKartu key={i} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	blok: { backgroundColor: colors.border, borderRadius: radius.sm },
	kartu: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.sm,
	},
	layar: { flex: 1, padding: spacing.xl, gap: spacing.sm, backgroundColor: colors.background },
});
