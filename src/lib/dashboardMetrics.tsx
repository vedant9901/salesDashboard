// /lib/dashboardMetrics.ts

import { computeNetAmount, computeNetMTDRevenue, computeNetMTDQty, computeNetMTDBillCuts } from "@/lib/utils";

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
) {
  // Ensure arrays are defined
  const yesterdaySales = selectedYesterday || [];
  const overallSales = selectedOverall || [];
  const lmSales = selectedLMSales || [];
  const lySales = selectedLYSales || [];
  const targets = selectedTargets || [];

  const mtdQty = overallSales.reduce((sum, s) => sum + safeNumber(s.Qty), 0);
  const totalSalesVal = overallSales.reduce((sum, s) => sum + safeNumber(s.NetAmount), 0);
  const lmTotal = lmSales.reduce((sum, s) => sum + safeNumber(s.NetAmount), 0);
  const totalLy = lySales.reduce((sum, s) => sum + safeNumber(s.NetAmount), 0);

  const yesterdayBills = yesterdaySales.reduce((sum, s) => sum + safeNumber(s.Bills), 0);
  const mtdBills = overallSales.reduce((sum, s) => sum + safeNumber(s.Bills), 0);
  const lmBills = lmSales.reduce((sum, s) => sum + safeNumber(s.Bills), 0);
  const lyBills = lySales.reduce((sum, s) => sum + safeNumber(s.Bills), 0);

  const yesterdayIPT = yesterdayBills ? mtdQty / yesterdayBills : 0;
  const mtdIPT = mtdBills ? mtdQty / mtdBills : 0;
  const lmIPT = lmBills ? lmTotal / lmBills : 0;
  const lyIPT = lyBills ? totalLy / lyBills : 0;

  const totalTargetVal = targets.reduce((sum, t) => sum + safeNumber(t.Target), 0);
  const percentAchieved = totalTargetVal ? (totalSalesVal / totalTargetVal) * 100 : 0;
  const mtdGrowth = lmTotal > 0 ? ((totalSalesVal - lmTotal) / lmTotal) * 100 : 0;

  return {
    totalNetAmount: totalSalesVal,
    totalSalesVal,
    totalTargetVal,
    percentAchieved,
    mtdGrowth,
    lmTotal,
    totalLy,
    mtdQty,
    lyQty: lySales.reduce((sum, s) => sum + safeNumber(s.Qty), 0),
    yesterdayIPT,
    mtdIPT,
    lmIPT,
    lyIPT,
    yesterdayBills,
    mtdBills,
    lmBills,
    lyBills,
  };
}

