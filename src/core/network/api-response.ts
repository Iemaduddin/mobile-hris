import { ApiException } from "./api-exception";

/** Bentuk respons sukses backend: `{ success: true, data }`. */
export type ApiSuccess<T> = { success: true; data: T };

/** Bentuk respons gagal backend: `{ success: false, error, details? }`. */
export type ApiFailure = { success: false; error: string; details?: unknown };

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/**
 * Respons yang tidak memakai pembungkus `data` — dipakai `/api/files`
 * (`{success:true, path, url, ...}` sukses / `{error}` gagal).
 */
export type LooseApiResponse = {
	success?: boolean;
	error?: string;
	details?: unknown;
	[key: string]: unknown;
};

/**
 * Ambil `data` dari respons sukses; lempar ApiException bila gagal.
 * Dipakai agar setiap pemanggil hanya menangani satu jalur sukses.
 *
 * Tiga bentuk respons ditangani:
 * - `{ success: true, data }` — konvensi baku `/api/v1`
 * - `{ success: true, ...field }` — `/api/files` (tanpa pembungkus `data`)
 * - `{ error }` — kegagalan `/api/files` (tanpa field `success`)
 */
export function unwrap<T>(payload: ApiResponse<T> | LooseApiResponse, status: number): T {
	if (!payload || typeof payload !== "object") {
		throw new ApiException("Respons server tidak valid.", status);
	}
	const res = payload as LooseApiResponse;

	if (res.success === false) {
		throw new ApiException(res.error || "Terjadi kesalahan.", status, res.details);
	}
	if (res.success === true) {
		if ("data" in res) return (res as unknown as ApiSuccess<T>).data;
		const { success: _success, ...rest } = res;
		return rest as T;
	}
	if (typeof res.error === "string") {
		throw new ApiException(res.error, status, res.details);
	}
	throw new ApiException("Respons server tidak valid.", status);
}
