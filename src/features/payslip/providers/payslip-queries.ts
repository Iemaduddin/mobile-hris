import { useQuery } from "@tanstack/react-query";
import { getSlipDetail, getSlipSaya } from "../data/payslip-api";

export const payslipKeys = {
	all: ["payslip"] as const,
	list: () => [...payslipKeys.all, "list"] as const,
	detail: (nomor: string) => [...payslipKeys.all, "detail", nomor] as const,
};

/** Daftar slip yang sudah DITERBITKAN (PRD Bag. 5.5). */
export function useSlipList() {
	return useQuery({
		queryKey: payslipKeys.list(),
		queryFn: ({ signal }) => getSlipSaya(signal),
		select: (data) => data.items,
	});
}

/** Rincian satu slip: pendapatan, potongan, iuran (perusahaan vs karyawan). */
export function useSlipDetail(nomor: string) {
	return useQuery({
		queryKey: payslipKeys.detail(nomor),
		queryFn: ({ signal }) => getSlipDetail(nomor, signal),
		select: (data) => data.slip,
		enabled: nomor.length > 0,
	});
}
