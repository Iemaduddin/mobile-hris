import { useQuery } from "@tanstack/react-query";
import { getMyPayslips, getPayslipDetail } from "../data/payslips-api";

export const payslipsKeys = {
	all: ["payslips"] as const,
	list: () => [...payslipsKeys.all, "list"] as const,
	detail: (number: string) => [...payslipsKeys.all, "detail", number] as const,
};

/** Published payslips list (PRD Bag. 5.5). */
export function usePayslipList() {
	return useQuery({
		queryKey: payslipsKeys.list(),
		queryFn: ({ signal }) => getMyPayslips(signal),
		select: (data) => data.items,
	});
}

/** One payslips's detail: earnings, deductions, contributions (company vs employee). */
export function usePayslipDetail(number: string) {
	return useQuery({
		queryKey: payslipsKeys.detail(number),
		queryFn: ({ signal }) => getPayslipDetail(number, signal),
		select: (data) => data.slip,
		enabled: number.length > 0,
	});
}
