// utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------- Unified Sales Record Type ----------------------
export interface SalesRecord {
  StoreCode: number;
  StoreName?: string;
  BillSeries: string;
  Amount: number | string;
  Quantity?: number;
  TotalBills?: number;
  Date?: string;
  TotalSales?: number;
}

// Safe numeric conversion
export const safeNumber = (v: any): number => {
  const n = Number(String(v).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

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

// ---------------------- Normalize Store Names & Codes ----------------------
export function normalizeSales(sales: SalesRecord[]): SalesRecord[] {
  return sales.map((item) => {
    if (item.StoreName && nameToCodeMap[item.StoreName]) {
      return { ...item, StoreCode: nameToCodeMap[item.StoreName] };
    }
    if (item.StoreName && nameToNameAndCodeMap[item.StoreName]) {
      const [newName, newCode] = nameToNameAndCodeMap[item.StoreName];
      return { ...item, StoreName: newName, StoreCode: newCode };
    }
    return item;
  });
}

// ---------------------- Merge Function ----------------------
export function mergeAndRemoveStore(
  sales: SalesRecord[],
  mergeInto: number,
  mergeFrom: number
): SalesRecord[] {
  return sales
    .map((item) =>
      item.StoreCode === mergeFrom
        ? { ...item, StoreCode: mergeInto }
        : item
    )
    .filter((item) => item.StoreCode !== mergeFrom);
}

export function applyMultiMerge(
  sales: SalesRecord[],
  mergeRules: [from: number, into: number][] = [
    [35, 8],
    // [62, 30],
  ]
): SalesRecord[] {
  let merged = [...sales];

  mergeRules.forEach(([from, into]) => {
    if (!merged.some((s) => s.StoreCode === into)) {
      merged.push({ StoreCode: into, BillSeries: "SC", Amount: 0 });
    }
    merged = mergeAndRemoveStore(merged, into, from);
  });

  return merged;
}

// ---------------------- Compute Net Amount ----------------------
export function computeNetAmount(
  sales: SalesRecord[],
  storeCode?: number
): number | Record<number, number> {
  const norms = normalizeSales(sales);
  const merged = applyMultiMerge(norms);

  const totals: Record<number, { sc: number; lsr: number }> = {};

  merged.forEach((item) => {
    const series = item.BillSeries?.toUpperCase();
    const amt = safeNumber(item.Amount);

    if (!totals[item.StoreCode]) totals[item.StoreCode] = { sc: 0, lsr: 0 };

    if (["SC", "B2B", "WB", "IS"].includes(series)) totals[item.StoreCode].sc += amt;
    if (series === "LSR") totals[item.StoreCode].lsr += Math.abs(amt);
  });

  const net: Record<number, number> = {};
  Object.keys(totals).forEach((code) => {
    const { sc, lsr } = totals[Number(code)];
    net[Number(code)] = sc - lsr;
  });

  return storeCode !== undefined ? net[storeCode] ?? 0 : net;
}

// ---------------------- Compute Net MTD Revenue ----------------------
export function computeNetMTDRevenue(
  sales: SalesRecord[],
  storeCode?: number
): number | Record<number, number> {
  const merged = applyMultiMerge(normalizeSales(sales));

  const totals: Record<number, { sc: number; lsr: number }> = {};

  merged.forEach((item) => {
    const series = item.BillSeries?.toUpperCase();
    const amt = safeNumber(item.Amount);

    if (!totals[item.StoreCode]) totals[item.StoreCode] = { sc: 0, lsr: 0 };

    if (["SC", "B2B", "WB", "IS"].includes(series)) totals[item.StoreCode].sc += amt;
    if (series === "LSR") totals[item.StoreCode].lsr += Math.abs(amt);
  });

  const net: Record<number, number> = {};
  Object.keys(totals).forEach((code) => {
    const { sc, lsr } = totals[Number(code)];
    net[Number(code)] = sc - lsr;
  });

  return storeCode !== undefined ? net[storeCode] ?? 0 : net;
}

// ---------------------- Compute Net MTD Qty ----------------------
export function computeNetMTDQty(
  sales: SalesRecord[],
  storeCode?: number
): number | Record<number, number> {
  const merged = applyMultiMerge(normalizeSales(sales));

  const totals: Record<number, { sc: number; lsr: number }> = {};

  merged.forEach((item) => {
    const series = item.BillSeries?.toUpperCase();
    const qty = safeNumber(item.Quantity);

    if (!totals[item.StoreCode]) totals[item.StoreCode] = { sc: 0, lsr: 0 };

    if (["SC", "B2B", "WB", "IS"].includes(series)) totals[item.StoreCode].sc += qty;
    if (series === "LSR") totals[item.StoreCode].lsr += Math.abs(qty);
  });

  const result: Record<number, number> = {};
  Object.keys(totals).forEach((code) => {
    result[Number(code)] = totals[Number(code)].sc;
  });

  return storeCode !== undefined ? result[storeCode] ?? 0 : result;
}

// ---------------------- Compute MTD Bill Cuts ----------------------
export function computeNetMTDBillCuts(
  sales: SalesRecord[],
  storeCode?: number
) {
  const merged = applyMultiMerge(normalizeSales(sales));

  const totals: Record<number, { sc: number; lsr: number }> = {};

  merged.forEach((item) => {
    const series = item.BillSeries?.toUpperCase();
    const bills = safeNumber(item.TotalBills);

    if (!totals[item.StoreCode]) totals[item.StoreCode] = { sc: 0, lsr: 0 };

    if (["SC", "B2B", "WB", "IS"].includes(series)) totals[item.StoreCode].sc += bills;
    if (series === "LSR") totals[item.StoreCode].lsr += Math.abs(bills);
  });

  const result: Record<number, number> = {};
  Object.keys(totals).forEach((code) => {
    result[Number(code)] = totals[Number(code)].sc;
  });

  return storeCode !== undefined ? result[storeCode] ?? 0 : result;
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

// ---------------------- Date Helpers ----------------------
export const formatLocalDate = (d: Date) => {
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

export const getLast13Months = () => {
  const list: { label: string; start: string; end: string }[] = [];
  const today = new Date();
  for (let i = 12; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    list.push({
      label: date.toLocaleString("default", { month: "short", year: "numeric" }),
      start: formatLocalDate(start),
      end: formatLocalDate(end),
    });
  }
  return list;
};

// ---------------------- Sales Computation ----------------------
export const computeMonthlySales = (
  salesData: SalesRecord[],
  months: { start: string; end: string; label?: string }[]
) => {
  return months.map((m) => {
    const monthly = salesData
      .filter((s) => s.Date && s.Date >= m.start && s.Date <= m.end)
      .reduce((sum, s) => sum + safeNumber(s.TotalSales), 0);

    return { month: m.label, totalSales: monthly };
  });
};

// ---------------------- Color Helpers ----------------------
export const getRGMColor = (rgm: number) => {
  if (rgm < 20) return "text-red-600 font-bold";
  if (rgm < 40) return "text-yellow-600 font-semibold";
  return "text-green-600 font-semibold";
};

export const getPieData = (dept: any) =>
  dept.SubClasses?.map((sub: any) => ({
    name: sub.SubClass,
    value: sub.RGM,
    lastMonth: sub.LastMonthRGM ?? 0,
  })) ?? [];

export const formatMonthName = (monthStr: string) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
};
