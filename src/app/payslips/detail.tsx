import { useLocalSearchParams } from "expo-router";
import { PayslipDetailScreen } from "@/features/payslips/presentation/payslips-detail-screen";

/** One payslips's detail — `number` param comes from the list. */
export default function PayslipDetailRoute() {
	const { number } = useLocalSearchParams<{ number?: string }>();
	if (!number) return null;
	return <PayslipDetailScreen number={number} />;
}
