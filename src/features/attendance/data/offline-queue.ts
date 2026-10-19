import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { AttendanceInput } from "../models/attendance";

/**
 * P6-5 — antrean presensi offline (mobile PRD Bag. 5.3.A).
 *
 * Saat perangkat tidak dapat menghubungi server, event presensi disimpan lokal
 * lalu dikirim ulang apa adanya. Waktu event diambil saat tombol ditekan, bukan
 * saat kiriman berhasil — jam presensi tetap jujur dan server menandainya
 * `terlambatKirim` agar HR dapat meninjau.
 */

const STORAGE_KEY = "hris.attendance_queue";

/** Batas antrean: item terlama dibuang lebih dulu (SecureStore menyimpan nilai kecil). */
export const MAX_QUEUE = 20;

export type QueuedClock = {
	id: string;
	/** Pemilik event — antrean tak boleh terkirim atas nama karyawan lain. */
	employeeId: string;
	/** Payload apa adanya untuk POST /api/v1/attendance (sudah memuat `time`). */
	input: AttendanceInput;
	queuedAt: number;
};

/** Abstraksi penyimpanan supaya logika antrean dapat diuji tanpa perangkat. */
export type QueueStorage = {
	read: () => Promise<string | null>;
	write: (value: string | null) => Promise<void>;
};

const canUseSecureStore = Platform.OS !== "web";

const secureStoreStorage: QueueStorage = {
	read: () => (canUseSecureStore ? SecureStore.getItemAsync(STORAGE_KEY) : Promise.resolve(null)),
	write: (value) =>
		canUseSecureStore
			? value === null
				? SecureStore.deleteItemAsync(STORAGE_KEY)
				: SecureStore.setItemAsync(STORAGE_KEY, value)
			: Promise.resolve(),
};

/** Penyimpanan in-memory — fallback web dan alat uji. */
export function createMemoryStorage(initial: string | null = null): QueueStorage {
	let value = initial;
	return {
		read: async () => value,
		write: async (next) => {
			value = next;
		},
	};
}

function newId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Baca + bersihkan antrean; data rusak diperlakukan sebagai antrean kosong. */
function parse(raw: string | null): QueuedClock[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter(
				(item): item is QueuedClock =>
					typeof item === "object" &&
					item !== null &&
					typeof (item as QueuedClock).id === "string" &&
					typeof (item as QueuedClock).employeeId === "string" &&
					typeof (item as QueuedClock).input === "object",
			)
			.sort((a, b) => a.queuedAt - b.queuedAt);
	} catch {
		return [];
	}
}

/**
 * Antrean presensi offline. Semua operasi menulis ulang seluruh isi antrean
 * (kecil dan jarang) sehingga tidak ada state parsial di penyimpanan.
 */
export function createAttendanceQueue(storage: QueueStorage) {
	async function list(): Promise<QueuedClock[]> {
		return parse(await storage.read());
	}

	async function save(items: QueuedClock[]): Promise<void> {
		await storage.write(items.length === 0 ? null : JSON.stringify(items));
	}

	/** @returns antrean terbaru setelah penambahan. */
	async function enqueue(entry: { employeeId: string; input: AttendanceInput }): Promise<QueuedClock[]> {
		const items = await list();
		const next = [
			...items,
			{ id: newId(), employeeId: entry.employeeId, input: entry.input, queuedAt: Date.now() },
		].slice(-MAX_QUEUE);
		await save(next);
		return next;
	}

	async function remove(id: string): Promise<void> {
		const items = await list();
		await save(items.filter((item) => item.id !== id));
	}

	async function clear(): Promise<void> {
		await save([]);
	}

	return { list, enqueue, remove, clear };
}

/** Antrean perangkat aplikasi. */
export const attendanceQueue = createAttendanceQueue(secureStoreStorage);
