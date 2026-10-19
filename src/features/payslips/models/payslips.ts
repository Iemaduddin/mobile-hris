export type MyPayslip = {
	number: string;
	period: string;
	netPay: string;
};

export type PayslipLine = {
	code: string;
	name: string;
	group: string;
	amount: number;
	description: string;
};

export type PayslipDetail = {
	number: string;
	period: string;
	employeeName: string;
	employeeNumber: string;
	baseSalary: string;
	totalEarnings: string;
	totalDeductions: string;
	netPay: string;
	presentDays: number;
	absentDays: number;
	lines: PayslipLine[];
};

const MONTHS = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

const GROUP_LABELS: Record<string, string> = {
	PENDAPATAN: "Pendapatan",
	TUNJANGAN: "Tunjangan",
	POTONGAN: "Potongan",
	IURAN: "Iuran (karyawan)",
	BIAYA_PERUSAHAAN: "Ditanggung perusahaan",
};

const GROUP_ORDER = ["PENDAPATAN", "TUNJANGAN", "POTONGAN", "IURAN", "BIAYA_PERUSAHAAN"];

/** "2026-09" -> "September 2026". */
export function getPeriodLabel(period: string): string {
	const [year, month] = period.split("-");
	const index = Number(month) - 1;
	if (!year || Number.isNaN(index) || index < 0 || index > 11) return period;
	return `${MONTHS[index]} ${year}`;
}

export type PayslipLineGroup = {
	group: string;
	label: string;
	items: PayslipLine[];
	subtotal: number;
};

/** Lines grouped per group (earnings/allowances/deductions/contributions). */
export function groupPayslipLines(lines: PayslipLine[]): PayslipLineGroup[] {
	return GROUP_ORDER.map((group) => {
		const items = lines.filter((r) => r.group === group);
		return {
			group,
			label: GROUP_LABELS[group] ?? group,
			items,
			subtotal: items.reduce((total, r) => total + (Number(r.amount) || 0), 0),
		};
	}).filter((g) => g.items.length > 0);
}
