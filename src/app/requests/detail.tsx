import { useLocalSearchParams } from "expo-router";
import { RequestDetailScreen } from "@/features/requests/presentation/request-detail-screen";
import type { JenisPengajuan } from "@/features/requests/models/request";

function jenisDariParam(value?: string): JenisPengajuan {
	if (value === "lembur" || value === "dinas") return value;
	return "cuti";
}

/** Detail pengajuan + aksi ajukan/batal — dibuka dari tab Pengajuan. */
export default function PengajuanDetailRoute() {
	const { id, jenis } = useLocalSearchParams<{ id?: string; jenis?: string }>();
	if (!id) return null;
	return <RequestDetailScreen id={id} jenis={jenisDariParam(jenis)} />;
}
