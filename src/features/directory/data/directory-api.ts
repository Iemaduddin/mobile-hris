import { api } from "@/core/network/api-client";

/** Direktori karyawan read-only (HR/admin) — tanpa data sensitif. */

export type DirectoryEmployee = {
	id: string;
	employeeNumber: string;
	fullName: string;
	status: string;
	phone: string | null;
	email: string | null;
	positionName: string | null;
	unitName: string | null;
};

export type DirectoryResponse = {
	query: string;
	count: number;
	items: DirectoryEmployee[];
};

export function searchEmployees(query: string, signal?: AbortSignal): Promise<DirectoryResponse> {
	const suffix = query ? `?query=${encodeURIComponent(query)}` : "";
	return api.get<DirectoryResponse>(`/api/v1/employees${suffix}`, { signal });
}
