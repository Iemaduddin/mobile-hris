import { useCallback, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, useColorScheme, View } from "react-native";
import { daftarkanPushToken, usePushNotifikasi } from "@/core/notifications/push";
import { colors } from "@/core/theme";
import { useAuthStore } from "@/features/auth/providers/auth-store";
import { requestKeys } from "@/features/requests/providers/requests-queries";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
	},
});

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
	const colorScheme = useColorScheme();
	const status = useAuthStore((s) => s.status);
	const initialize = useAuthStore((s) => s.initialize);

	useEffect(() => {
		void initialize();
	}, [initialize]);

	useAuthGuard(status);

	// Push notification (PRD mobile Bag. 5.8 / M4):
	// daftarkan token setelah sesi terkonfirmasi; tap → deep link,
	// notifikasi di foreground → refresh daftar pengajuan in-app.
	useEffect(() => {
		if (status !== "signedIn") return;
		void daftarkanPushToken();
	}, [status]);

	const refreshPengajuan = useCallback(() => {
		void queryClient.invalidateQueries({ queryKey: requestKeys.all });
	}, []);
	usePushNotifikasi({ siap: status === "signedIn", onNotifikasiDiterima: refreshPengajuan });

	if (status === "loading") {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
			<QueryClientProvider client={queryClient}>
				<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
					<StatusBar style="auto" />
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
