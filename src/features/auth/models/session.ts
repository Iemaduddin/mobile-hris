/** Session data from login and `/api/v1/me`. */

export type SessionUser = {
	id: string;
	name?: string | null;
	email?: string | null;
	role?: string | null;
};

/** Active-placement work site — used for attendance radius previews. */
export type MyWorkLocation = {
	id: string;
	name: string;
	latitude: number | null;
	longitude: number | null;
	radiusMeters: number | null;
};

export type ActivePlacement = {
	position?: { name: string } | null;
	orgUnit?: { name: string } | null;
	workLocation?: MyWorkLocation | null;
};

export type SessionEmployee = {
	id: string;
	employeeNumber: string;
	fullName: string;
	status: string;
	/** Photo file path (latest FOTO document) — null when absent. */
	photoUrl?: string | null;
	placements?: ActivePlacement[];
};

export type MeResponse = {
	user: SessionUser | null;
	employee: SessionEmployee | null;
};

export type LoginResponse = {
	token?: string;
	user?: SessionUser;
};

/** Reference work site for attendance from the active placement (`null` when absent). */
export function myWorkLocation(employee: SessionEmployee | null): MyWorkLocation | null {
	return employee?.placements?.[0]?.workLocation ?? null;
}

/** Active placement label, e.g. "Staf · HR & GA". */
export function getPlacementLabel(employee: SessionEmployee | null): string | null {
	const placement = employee?.placements?.[0];
	const position = placement?.position?.name;
	const unit = placement?.orgUnit?.name;
	if (!position && !unit) return null;
	return [position, unit].filter(Boolean).join(" · ");
}
