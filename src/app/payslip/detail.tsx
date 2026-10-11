import { useLocalSearchParams } from "expo-router";
import { PayslipDetailScreen } from "@/features/payslip/presentation/payslip-detail-screen";

/** Rincian satu slip gaji — param `nomor` dikirim dari daftar. */
export default function SlipGajiDetailRoute() {
	const { nomor } = useLocalSearchParams<{ nomor?: string }>();
	if (!nomor) return null;
	return <PayslipDetailScreen nomor={nomor} />;
}
