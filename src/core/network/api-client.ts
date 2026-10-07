import { apiUrl } from "../config/app-config";
import { tokenStore } from "../storage/token-store";
import { ApiException, NetworkException } from "./api-exception";
import { unwrap, type ApiResponse } from "./api-response";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
	method?: HttpMethod;
	body?: unknown;
	/** Multipart/form-data (unggah lampiran). Mengabaikan `body` biasa. */
	formData?: FormData;
	signal?: AbortSignal;
	/** Lewati penyisipan token (khusus endpoint login). */
	skipAuth?: boolean;
};

/**
 * Klien API terpusat untuk `/api/v1`.
 * - Menempel `Authorization: Bearer <sessionToken>` (PRD mobile Bag. 7-B1)
 * - Mem-parse respons `{success, data}` / `{success, error}`
 * - Melempar ApiException/NetworkException agar layar tinggal menangkap
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { method = "GET", body, formData, signal, skipAuth = false } = options;

	const headers: Record<string, string> = { Accept: "application/json" };
	// Untuk FormData, Content-Type sengaja tidak di-set agar boundary dibuat runtime.
	if (formData === undefined && body !== undefined) headers["Content-Type"] = "application/json";

	if (!skipAuth) {
		const token = await tokenStore.get();
		if (token) headers.Authorization = `Bearer ${token}`;
	}

	let response: Response;
	try {
		response = await fetch(apiUrl(path), {
			method,
			headers,
			body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
			signal,
		});
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") throw error;
		throw new NetworkException();
	}

	let payload: ApiResponse<T> | null = null;
	try {
		payload = (await response.json()) as ApiResponse<T>;
	} catch {
		throw new ApiException("Respons server tidak dapat dibaca.", response.status);
	}

	return unwrap(payload, response.status);
}

/** Shorthand method HTTP. */
export const api = {
	get: <T>(path: string, options?: RequestOptions) =>
		apiRequest<T>(path, { ...options, method: "GET" }),
	post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		apiRequest<T>(path, { ...options, method: "POST", body }),
	put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		apiRequest<T>(path, { ...options, method: "PUT", body }),
	delete: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		apiRequest<T>(path, { ...options, method: "DELETE", body }),
	/** Kirim multipart/form-data (unggah lampiran pengajuan). */
	form: <T>(path: string, formData: FormData, options?: RequestOptions) =>
		apiRequest<T>(path, { ...options, method: "POST", formData }),
};
