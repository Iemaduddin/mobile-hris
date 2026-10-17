export type ProfilePlacement = {
	position: string | null;
	orgUnit: string | null;
	effectiveDate: string | null;
	endDate: string | null;
	location: {
		name: string;
		address: string | null;
		city: string | null;
		province: string | null;
		postalCode: string | null;
		latitude: number | null;
		longitude: number | null;
		radiusMeters: number | null;
	} | null;
};

export type Profile = {
	employeeNumber: string;
	fullName: string;
	gender: string;
	birthDate: string | null;
	/** Already masked server-side (e.g. 3273••••••1234) per PRD Bag. 8. */
	nik: string | null;
	npwp: string | null;
	/** Photo file path (latest FOTO document) — null when absent. */
	photoUrl?: string | null;
	phone: string | null;
	email: string | null;
	address: string | null;
	status: string;
	joinDate: string;
	resignDate: string | null;
	role: string | null;
	directManager: {
		fullName: string;
		employeeNumber: string;
		position: string | null;
	} | null;
	placement: ProfilePlacement | null;
	contract: {
		contractNumber: string;
		contractType: string;
		startDate: string | null;
		endDate: string | null;
		status: string;
	} | null;
};

const GENDER_LABELS: Record<string, string> = {
	LAKI_LAKI: "Laki-laki",
	PEREMPUAN: "Perempuan",
};

const CONTRACT_LABELS: Record<string, string> = {
	PKWT: "PKWT (kontrak terbatas)",
	PKWTT: "PKWTT (tetap)",
	MAGANG: "Magang",
	FREELANCE: "Freelance",
	OUTSOURCING: "Outsourcing",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
	DRAFT: "Draf",
	AKTIF: "Aktif",
	AKAN_BERAKHIR: "Akan berakhir",
	BERAKHIR: "Berakhir",
	DIBATALKAN: "Dibatalkan",
};

export function getGenderLabel(gender: string): string {
	return GENDER_LABELS[gender] ?? gender;
}

export function getContractTypeLabel(contractType: string): string {
	return CONTRACT_LABELS[contractType] ?? contractType;
}

export function getContractStatusLabel(status: string): string {
	return CONTRACT_STATUS_LABELS[status] ?? status;
}

/** Avatar initials (max. first 2 letters of each word). */
export function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase() ?? "")
		.join("");
}
