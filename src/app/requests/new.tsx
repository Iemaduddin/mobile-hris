import { useLocalSearchParams } from "expo-router";
import { RequestFormScreen } from "@/features/requests/presentation/request-form-screen";
import type { RequestKind } from "@/features/requests/models/request";

function kindFromParam(value?: string): RequestKind {
	if (value === "overtime" || value === "duty") return value;
	return "leave";
}

/** Request create screen — opened from the Requests tab (mobile PRD Bag. 5.4). */
export default function NewRequestRoute() {
	const { kind } = useLocalSearchParams<{ kind?: string }>();
	return <RequestFormScreen initialKind={kindFromParam(kind)} />;
}
