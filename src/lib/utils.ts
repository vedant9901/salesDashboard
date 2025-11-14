import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------- Store Normalization ----------------------
const nameToCodeMap: Record<string, number> = {
  "NASTABAZAR WAREHOUSE": 42,
  "NASTA BAZAR SHELA": 44,
  "NASTA BAZAR BODAKDEV": 45,
  "NASTA BAZAR JODHPUR": 53,
  "NASTA BAZAR RAJKOT": 58,
  "NASTA BAZAR SOBO": 61,
};

const nameToNameAndCodeMap: Record<string, [string, number]> = {
  "FOOD BOOK ASSOCIATE LLP VIJAY CHAR RASTA": ["MAGSON VIJAY CHAR RASTA", 51],
  "FARMAGS ASSOCIATES LLP": ["MAGSON SOUTH BOPAL", 50],
  "SADAA": ["MAGSON SHANTIGRAM", 55],
  "FOOD BOOK ASSOCIATE LLP HEBATPUR": ["MAGSON HEBATPUR", 52],
  "KRISHIV FOODS": ["MAGSON INFOCITY", 54],
  "MAGSON - MCW": ["MCW BODAKDEV", 31],
};

// ---------------------- Safe Merge Function ----------------------
export function mergeAndRemoveStore(
  sales: { StoreCode: number; BillSeries: string; Amount: number | string }[],
  mergeInto: number,
  mergeFrom: number
) {
  if (!sales || !Array.isArray(sales)) return [];
  return sales
    .map((item) =>
      item.StoreCode === mergeFrom
        ? { ...item, StoreCode: mergeInto } // Merge into target store
        : item
    )
    .filter((item) => item.StoreCode !== mergeFrom); // Remove merged store
}

export function applyMultiMerge(
  sales: { StoreCode: number; BillSeries: string; Amount: number | string }[],
  mergeRules: [from: number, into: number][] = [
    [35, 8],
    // [62, 30],
  ]
) {
  let mergedSales = [...sales];
  mergeRules.forEach(([from, into]) => {
    // Create target store if it doesn't exist yet
    if (!mergedSales.some((item) => item.StoreCode === into)) {
      mergedSales.push({ StoreCode: into, BillSeries: "SC", Amount: 0 });
    }
    mergedSales = mergeAndRemoveStore(mergedSales, into, from);
  });
  return mergedSales;
}

// ---------------------- Normalize Store Names/Codes ----------------------
export function normalizeSales(
  sales: { StoreCode: number; StoreName: string; BillSeries: string; Amount: number | string }[]
) {
  return sales.map((item) => {
    if (nameToCodeMap[item.StoreName]) {
      return { ...item, StoreCode: nameToCodeMap[item.StoreName] };
    }
    if (nameToNameAndCodeMap[item.StoreName]) {
      const [newName, newCode] = nameToNameAndCodeMap[item.StoreName];
      return { ...item, StoreName: newName, StoreCode: newCode };
    }
    return item;
  });
}

// ---------------------- Compute Net Amount ----------------------
export function computeNetAmount(
  sales: { StoreCode: number; StoreName?: string; BillSeries: string; Amount: number | string }[],
  storeCode?: number
): number | Record<number, number> {
  const totals: Record<number, { sc: number; lsr: number }> = {};

  // 1️⃣ Normalize stores
  const normalized = normalizeSales(sales);

  // 2️⃣ Apply merges
  const mergedSales = applyMultiMerge(normalized);

  mergedSales.forEach(({ StoreCode, BillSeries, Amount }) => {
    const amt = Number(String(Amount).replace(/,/g, "")) || 0;
    const series = BillSeries?.trim().toUpperCase();

    if (!totals[StoreCode]) totals[StoreCode] = { sc: 0, lsr: 0 };

    // SC + B2B + WB + IS
    if (["SC", "B2B", "WB", "IS"].includes(series)) totals[StoreCode].sc += amt;

    // LSR subtraction
    if (series === "LSR") totals[StoreCode].lsr += Math.abs(amt);
  });

  const netAmounts: Record<number, number> = {};
  for (const code in totals) {
    const { sc, lsr } = totals[code];
    netAmounts[Number(code)] = sc - lsr;
  }

  if (storeCode !== undefined) return netAmounts[storeCode] || 0;
  return netAmounts;
}

// ---------------------- Compute Net MTD Revenue ----------------------
export function computeNetMTDRevenue(
  sales: { StoreCode: number; StoreName?: string; BillSeries: string; Amount: number | string }[],
  storeCode?: number
): number | Record<number, number> {
  const normalized = normalizeSales(sales);
  const mergedSales = applyMultiMerge(normalized);

  const totals: Record<number, { sc: number; lsr: number }> = {};

  mergedSales.forEach(({ StoreCode, BillSeries, Amount , Quantity}) => {
    const amt = Number(Amount) || 0;
    const series = BillSeries?.trim().toUpperCase();

    if (!totals[StoreCode]) totals[StoreCode] = { scAmt: 0, lsrAmt: 0 };

    if (["SC", "B2B", "WB", "IS"].includes(series)) {
      totals[StoreCode].scAmt += amt;
    }
    if (series === "LSR") {
      totals[StoreCode].lsrAmt += Math.abs(amt);
    }
  });

  const netAmount: Record<number, number> = {};
    console.log('called')

  for (const StoreCode in totals) {
    const { scAmt, lsrAmt} = totals[StoreCode];
    netAmount[Number(StoreCode)] = scAmt - lsrAmt;
  }
  return storeCode !== undefined ? netAmount[storeCode] || 0 : netAmount;
}

// ---------------------- Compute Net MTD Revenue ----------------------
export function computeNetMTDQty(
  sales: { StoreCode: number; StoreName?: string; BillSeries: string; Amount: number | string }[],
  storeCode?: number
): number | Record<number, number> {
  const normalized = normalizeSales(sales);
  const mergedSales = applyMultiMerge(normalized);

  const totals: Record<number, { sc: number; lsr: number }> = {};

  mergedSales.forEach(({ StoreCode, BillSeries, Amount , Quantity}) => {
    const series = BillSeries?.trim().toUpperCase();
    const qty = Number(Quantity) || 0;

    if (!totals[StoreCode]) totals[StoreCode] = { scQty: 0, lsrQty: 0 };

    if (["SC", "B2B", "WB", "IS"].includes(series)) {
      totals[StoreCode].scQty += qty;
    }
    if (series === "LSR") {
      totals[StoreCode].lsrQty += Math.abs(qty);
    }
  });

  const netQuantity: Record<number, number> = {};

  for (const StoreCode in totals) {
    const {  scQty, lsrQty } = totals[StoreCode];
    netQuantity[Number(StoreCode)] = scQty;
  }
  return storeCode !== undefined ? netQuantity[storeCode] || 0 : netQuantity;
}

// ---------------------- Compute Net MTD Revenue ----------------------
export function computeNetMTDBillCuts(
  sales: { StoreCode: number; StoreName?: string; BillSeries: string; Amount: number | string }[],
  storeCode?: number
): number | Record<number, number> {
  const normalized = normalizeSales(sales);
  const mergedSales = applyMultiMerge(normalized);

  const totals: Record<number, { sc: number; lsr: number }> = {};

  mergedSales.forEach(({ StoreCode, BillSeries, Amount , Quantity,TotalBills}) => {
    const series = BillSeries?.trim().toUpperCase();
    const bills = Number(TotalBills) || 0;

    if (!totals[StoreCode]) totals[StoreCode] = { scbills: 0, lsrbills: 0 };

    if (["SC", "B2B", "WB", "IS"].includes(series)) {
      totals[StoreCode].scbills += bills;
    }
    if (series === "LSR") {
      totals[StoreCode].lsrbills += Math.abs(bills);
    }
  });

  const netbills: Record<number, number> = {};

  for (const StoreCode in totals) {
    const {  scbills, lsrbills } = totals[StoreCode];
    netbills[Number(StoreCode)] = scbills;
  }
  return storeCode !== undefined ? netbills[storeCode] || 0 : netbills;
}

// ---------------------- Unique By ----------------------
export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

// ---------------------- Number Formatting ----------------------
export function standardFormat(num: number) {
  return Math.round(num).toLocaleString("en-IN");
}


export function compactFormat(num: number) {
  return num.toLocaleString("en-IN", { notation: "compact" });
}

// ---------------------- Date Formatting ----------------------
export const formatLocalDate = (d: Date) => {
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

export const getLast13Months = () => {
  const months: { label: string; start: string; end: string }[] = [];
  const today = new Date();
  for (let i = 12; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0); // last day
    months.push({
      label: date.toLocaleString("default", { month: "short", year: "numeric" }),
      start: formatLocalDate(monthStart),
      end: formatLocalDate(monthEnd),
    });
  }
  return months;
};


// utils/sales.ts
export const computeMonthlySales = (
  salesData: any[],
  months: { start: string; end: string; label?: string }[]
) => {
  return months.map((m) => {
    const monthlySales = salesData
      .filter((s) => s.Date >= m.start && s.Date <= m.end)
      .reduce((sum, s) => sum + (s.TotalSales || 0), 0);

    return {
      month: m.label,
      totalSales: monthlySales,
    };
  });
};

/**
 * Returns a Tailwind CSS class based on RGM (%) value.
 * @param rgm - RGM percentage
 * @returns Tailwind class string
 */
export const getRGMColor = (rgm: number): string => {
  if (rgm < 20) return 'text-red-600 font-bold';
  if (rgm < 40) return 'text-yellow-600 font-semibold';
  return 'text-green-600 font-semibold';
};


export const getPieData = (dept: any) => {
  return dept.SubClasses?.map((sub: any) => ({
    name: sub.SubClass,
    value: sub.RGM,
    lastMonth: sub.LastMonthRGM ?? 0,
  })) ?? [];
};

export const formatMonthName = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };