import { useEffect, useMemo } from "react";
import { Animated, StyleSheet, View, type DimensionValue, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/core/theme";

/**
 * Skeleton loading (UX-4): pulsing gray blocks as content placeholders,
 * replacing the fullscreen spinner so screen transitions feel instant.
 */
export function Skeleton({
	width = "100%",
	height = 16,
	style,
}: {
	width?: DimensionValue;
	height?: number;
	style?: ViewStyle;
}) {
	const pulse = useMemo(() => new Animated.Value(0.35), []);

	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
				Animated.timing(pulse, { toValue: 0.35, duration: 750, useNativeDriver: true }),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [pulse]);

	return <Animated.View style={[styles.block, { width, height, opacity: pulse }, style]} />;
}

/** Single list-card skeleton (title + 2 rows). */
export function CardSkeleton({ id }: { id?: string }) {
	return (
		<View key={id} style={styles.card}>
			<Skeleton width="55%" height={18} />
			<Skeleton width="90%" />
			<Skeleton width="70%" />
		</View>
	);
}

/** Screen skeleton: title + N cards — replaces the fullscreen LoadingView. */
export function ScreenSkeleton({ count = 4, showTitle = true }: { count?: number; showTitle?: boolean }) {
	return (
		<View style={styles.screen}>
			{showTitle ? <Skeleton width="45%" height={24} /> : null}
			{Array.from({ length: count }, (_, i) => (
				<CardSkeleton key={i} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	block: { backgroundColor: colors.border, borderRadius: radius.sm },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		gap: spacing.sm,
	},
	screen: { flex: 1, padding: spacing.xl, gap: spacing.sm, backgroundColor: colors.background },
});
