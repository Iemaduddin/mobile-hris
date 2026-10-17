import { useCallback, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { queryClient } from "@/core/network/query-client";
import { registerPushToken, usePushNotifications } from "@/core/notifications/push";
import { colors } from "@/core/theme";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { requestKeys } from "@/features/requests/providers/requests-queries";

/**
 * Auth gate (PRD mobile Bag. 5.1 route guard):
 * - status loading  → tampilkan indikator
 * - signedOut       → paksa ke /login
 * - signedIn        → blokir akses /login
 */
function useAuthGuard(status: "loading" | "signedOut" | "signedIn") {
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (status === "loading") return;

		const onLogin = segments[0] === "login";

		if (status === "signedOut" && !onLogin) {
			router.replace("/login");
		} else if (status === "signedIn" && onLogin) {
			router.replace("/");
		}
	}, [status, segments, router]);
}

export default function RootLayout() {
	const status = useAuthStore((s) => s.status);
	const initialize = useAuthStore((s) => s.initialize);

	useEffect(() => {
		void initialize();
	}, [initialize]);

	useEffect(() => {
		// Pastikan font ikon termuat eksplisit: komponen ikon kadang render
		// sebelum font selesai di-load otomatis (ikon tampil kosong).
		void Ionicons.loadFont().catch(() => undefined);
	}, []);

	useAuthGuard(status);

	// Push notification (PRD mobile Bag. 5.8 / M4):
	// daftarkan token setelah sesi terkonfirmasi; tap → deep link,
	// notifikasi di foreground → refresh daftar pengajuan in-app.
	useEffect(() => {
		if (status !== "signedIn") return;
		void registerPushToken();
	}, [status]);

	const refreshRequests = useCallback(() => {
		void queryClient.invalidateQueries({ queryKey: requestKeys.all });
	}, []);
	usePushNotifications({ ready: status === "signedIn", onNotificationReceived: refreshRequests });

	if (status === "loading") {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

		return (
			<QueryClientProvider client={queryClient}>
				{/* Kunci terang (app.json light): tanpa varian gelap agar putih konsisten. */}
				<ThemeProvider value={DefaultTheme}>
					<StatusBar style="dark" />
					{/* Semua layar memakai header sendiri (ScreenHeader) agar seragam. */}
					<Stack screenOptions={{ headerShown: false }} />
				</ThemeProvider>
			</QueryClientProvider>
	);
}

const styles = StyleSheet.create({
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.background,
	},
});
