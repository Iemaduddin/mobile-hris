/**
 * Error standar untuk semua panggilan API.
 * Pesan `message` berasal dari field `error` respons server
 * sehingga user melihat pesan validasi apa adanya.
 */
export class ApiException extends Error {
	readonly status: number;
	readonly details?: unknown;

	constructor(message: string, status: number, details?: unknown) {
		super(message);
		this.name = "ApiException";
		this.status = status;
		this.details = details;
	}

	/** Sesi tidak valid / kedaluwarsa → layar perlu logout. */
	get isUnauthorized(): boolean {
		return this.status === 401;
	}
}

/** Kegagalan jaringan (offline, DNS, timeout) — bukan kesalahan server. */
export class NetworkException extends ApiException {
	constructor(message = "Tidak dapat terhubung ke server. Periksa koneksi Anda.") {
		super(message, 0);
		this.name = "NetworkException";
	}
}
