import { QueryClient } from "@tanstack/react-query";

/**
 * Klien query global. WAJIB di-clear setiap ganti akun (login/logout)
 * agar data user lama tak bocor ke user baru — semua query key tidak
 * mengandung userId sehingga cache antar-akun akan tertukar bila tidak.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
	},
});
