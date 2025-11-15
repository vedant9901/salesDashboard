// /lib/dashboardMetrics.ts

import {
  computeNetAmount,
  computeNetMTDRevenue,
  computeNetMTDQty,
  computeNetMTDBillCuts,
} from "@/lib/utils";

/** Convert any value to a safe number */
function safeNumber(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

interface DashboardMetrics {
  totalNetAmount: number;
  yesterdayQty: number;
  yesterdayBills: number;
  yesterdayIPT: number;
  totalSalesVal: number;
  lmTotal: number;
  totalLy: number;
  mtdQty: number;
  lmQty: number;
  lyQty: number;
  mtdBills: number;
  lmBills: number;
  lyBills: number;
  mtdIPT: number;
  lmIPT: number;
  lyIPT: number;
  totalTargetVal: number;
  percentAchieved: number;
  mtdGrowth: number;
}

export function computeDashboardMetrics(
  selectedYesterday: any[] = [],
  selectedOverall: any[] = [],
  selectedLMSales: any[] = [],
  selectedLYSales: any[] = [],
  selectedTargets: any[] = []
): DashboardMetrics {
  // Safe arrays
  const yesterdaySales = selectedYesterday ?? [];
  const overallSales = selectedOverall ?? [];
  const lmSales = selectedLMSales ?? [];
  const lySales = selectedLYSales ?? [];
  const targets = selectedTargets ?? [];

  // Quantities
  const mtdQty = overallSales.reduce((sum, s) => sum + safeNumber(s.Qty), 0);
  const lmQty = lmSales.reduce((sum, s) => sum + safeNumber(s.Qty), 0);
  const lyQty = lySales.reduce((sum, s) => sum + safeNumber(s.Qty), 0);
  const yesterdayQty = yesterdaySales.reduce(
    (sum, s) => sum + safeNumber(s.Qty),
    0
  );

  // Sales amounts
  const totalSalesVal = overallSales.reduce((sum, s) => sum + safeNumber(s.NetAmount), 0);
  const lmTotal = lmSales.reduce((sum, s) => sum + safeNumber(s.NetAmount), 0);
  const totalLy = lySales.reduce((sum, s) => sum + safeNumber(s.NetAmount), 0);

  // Bills
  const yesterdayBills = yesterdaySales.reduce((sum, s) => sum + safeNumber(s.Bills), 0);
  const mtdBills = overallSales.reduce((sum, s) => sum + safeNumber(s.Bills), 0);
  const lmBills = lmSales.reduce((sum, s) => sum + safeNumber(s.Bills), 0);
  const lyBills = lySales.reduce((sum, s) => sum + safeNumber(s.Bills), 0);

  // IPT
  const yesterdayIPT = yesterdayBills ? yesterdayQty / yesterdayBills : 0;
  const mtdIPT = mtdBills ? mtdQty / mtdBills : 0;
  const lmIPT = lmBills ? lmTotal / lmBills : 0;
  const lyIPT = lyBills ? totalLy / lyBills : 0;

  // Targets
  const totalTargetVal = targets.reduce(
    (sum, t) => sum + safeNumber(t.Target),
    0
  );

  // Achieved % and Growth %
  const percentAchieved = totalTargetVal
    ? (totalSalesVal / totalTargetVal) * 100
    : 0;

  const mtdGrowth = lmTotal
    ? ((totalSalesVal - lmTotal) / lmTotal) * 100
    : 0;

  return {
    totalNetAmount: totalSalesVal,
    yesterdayQty,
    yesterdayBills,
    yesterdayIPT,
    totalSalesVal,
    lmTotal,
    totalLy,
    mtdQty,
    lmQty,
    lyQty,
    mtdBills,
    lmBills,
    lyBills,
    mtdIPT,
    lmIPT,
    lyIPT,
    totalTargetVal,
    percentAchieved,
    mtdGrowth,
  };
}
