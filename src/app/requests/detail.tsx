import { useLocalSearchParams } from "expo-router";
import { RequestDetailScreen } from "@/features/requests/presentation/request-detail-screen";
import type { RequestKind } from "@/features/requests/models/request";

function kindFromParam(value?: string): RequestKind {
	if (value === "overtime" || value === "duty") return value;
	return "leave";
}

/** Request detail + submit/cancel actions — opened from the Requests tab. */
export default function RequestDetailRoute() {
	const { id, kind } = useLocalSearchParams<{ id?: string; kind?: string }>();
	if (!id) return null;
	return <RequestDetailScreen id={id} kind={kindFromParam(kind)} />;
}
