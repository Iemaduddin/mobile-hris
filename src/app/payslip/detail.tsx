import { useLocalSearchParams } from "expo-router";
import { PayslipDetailScreen } from "@/features/payslip/presentation/payslip-detail-screen";

/** One payslip's detail — `number` param comes from the list. */
export default function PayslipDetailRoute() {
	const { number } = useLocalSearchParams<{ number?: string }>();
	if (!number) return null;
	return <PayslipDetailScreen number={number} />;
}
