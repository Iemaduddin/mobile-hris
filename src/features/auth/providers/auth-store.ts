import { create } from "zustand";
import { tokenStore } from "@/core/storage/token-store";
import { queryClient } from "@/core/network/query-client";
import { ApiException } from "@/core/network/api-exception";
import { unregisterPush } from "@/core/notifications/push";
import { attendanceQueue } from "@/features/attendance/data/offline-queue";
import { getMe, login as loginApi, logout as logoutApi } from "../data/auth-api";
import type { SessionEmployee, SessionUser } from "../models/session";

/**
 * Global auth status (mobile PRD Bag. 5.1).
 * The token never enters React state — secure store only.
 */

type AuthState = {
	status: "loading" | "signedOut" | "signedIn";
	user: SessionUser | null;
	employee: SessionEmployee | null;
	initialize: () => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	status: "loading",
	user: null,
	employee: null,

	/** Session check on app boot (mobile PRD Bag. 5.1 boot check). */
	initialize: async () => {
		const token = await tokenStore.get();
		if (!token) {
			set({ status: "signedOut", user: null, employee: null });
			return;
		}
		try {
			const me = await getMe();
			set({ status: "signedIn", user: me.user, employee: me.employee });
		} catch {
			// Expired/invalid token → wipe and ask for login again.
			await tokenStore.clear();
			set({ status: "signedOut", user: null, employee: null });
		}
	},

	signIn: async (email, password) => {
		const result = await loginApi(email, password);
		if (!result.token) {
			console.warn("[auth] Login sukses tetapi token tidak ada di respons.");
			throw new ApiException("Login gagal. Coba lagi.", 500);
		}
		// Account switch → drop the whole cache so the previous user's data never leaks.
		queryClient.clear();
		await tokenStore.set(result.token);
		const me = await getMe();
		set({ status: "signedIn", user: me.user, employee: me.employee });
	},

	signOut: async () => {
		// Unregister the device while the token is still valid
		// (revoke pushToken + deactivate device — PRD Bag. 6 no.17).
		await unregisterPush();
		try {
			await logoutApi();
		} catch {
			// Token may already be invalid — still wipe locally.
		}
		await tokenStore.clear();
		// P6-5: antrean presensi offline milik sesi ini tidak boleh tertinggal
		// di perangkat (bisa terkirim sebagai karyawan lain di sesi berikutnya).
		await attendanceQueue.clear();
		queryClient.clear();
		set({ status: "signedOut", user: null, employee: null });
	},

	refreshMe: async () => {
		if (get().status !== "signedIn") return;
		try {
			const me = await getMe();
			set({ user: me.user, employee: me.employee });
		} catch {
			// keep stale state
		}
	},
}));
