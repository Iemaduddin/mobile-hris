import { useLocalSearchParams } from "expo-router";
import { RequestFormScreen } from "@/features/requests/presentation/request-form-screen";
import type { JenisPengajuan } from "@/features/requests/models/request";

function jenisDariParam(value?: string): JenisPengajuan {
	if (value === "lembur" || value === "dinas") return value;
	return "cuti";
}

/** Layar buat pengajuan — dibuka dari tab Pengajuan (PRD mobile Bag. 5.4). */
export default function PengajuanBaruRoute() {
	const { jenis } = useLocalSearchParams<{ jenis?: string }>();
	return <RequestFormScreen jenisAwal={jenisDariParam(jenis)} />;
}
