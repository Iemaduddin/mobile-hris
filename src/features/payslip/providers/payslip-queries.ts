import { useQuery } from "@tanstack/react-query";
import { getMyPayslips, getPayslipDetail } from "../data/payslip-api";

export const payslipKeys = {
	all: ["payslips"] as const,
	list: () => [...payslipKeys.all, "list"] as const,
	detail: (number: string) => [...payslipKeys.all, "detail", number] as const,
};

/** Published payslip list (PRD Bag. 5.5). */
export function usePayslipList() {
	return useQuery({
		queryKey: payslipKeys.list(),
		queryFn: ({ signal }) => getMyPayslips(signal),
		select: (data) => data.items,
	});
}

/** One payslip's detail: earnings, deductions, contributions (company vs employee). */
export function usePayslipDetail(number: string) {
	return useQuery({
		queryKey: payslipKeys.detail(number),
		queryFn: ({ signal }) => getPayslipDetail(number, signal),
		select: (data) => data.slip,
		enabled: number.length > 0,
	});
}
