import { create } from "zustand";
import { tokenStore } from "@/core/storage/token-store";
import { batalDaftarPush } from "@/core/notifications/push";
import { getMe, login as loginApi, logout as logoutApi } from "../data/auth-api";
import type { SessionKaryawan, SessionUser } from "../models/session";

/**
 * Status autentikasi global (PRD mobile Bag. 5.1).
 * Token tidak pernah masuk React state — hanya di secure store.
 */

type AuthState = {
	status: "loading" | "signedOut" | "signedIn";
	user: SessionUser | null;
	karyawan: SessionKaryawan | null;
	initialize: () => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	status: "loading",
	user: null,
	karyawan: null,

	/** Cek sesi saat aplikasi dibuka (PRD mobile Bag. 5.1 boot check). */
	initialize: async () => {
		const token = await tokenStore.get();
		if (!token) {
			set({ status: "signedOut", user: null, karyawan: null });
			return;
		}
		try {
			const me = await getMe();
			set({ status: "signedIn", user: me.user, karyawan: me.karyawan });
		} catch {
			// Token kedaluwarsa/invalid → bersihkan dan minta login ulang.
			await tokenStore.clear();
			set({ status: "signedOut", user: null, karyawan: null });
		}
	},

	signIn: async (email, password) => {
		const result = await loginApi(email, password);
		if (!result.token) {
			throw new Error("Login berhasil tetapi token tidak diterima.");
		}
		await tokenStore.set(result.token);
		const me = await getMe();
		set({ status: "signedIn", user: me.user, karyawan: me.karyawan });
	},

	signOut: async () => {
		// Unregister perangkat dulu selagi token masih sah
		// (cabut pushToken + nonaktifkan device — PRD Bag. 6 no.17).
		await batalDaftarPush();
		try {
			await logoutApi();
		} catch {
			// Token mungkin sudah tidak valid — tetap bersihkan lokal.
		}
		await tokenStore.clear();
		set({ status: "signedOut", user: null, karyawan: null });
	},

	refreshMe: async () => {
		if (get().status !== "signedIn") return;
		try {
			const me = await getMe();
			set({ user: me.user, karyawan: me.karyawan });
		} catch {
			// biarkan state lama
		}
	},
}));
