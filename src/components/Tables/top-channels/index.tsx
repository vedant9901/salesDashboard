"use client";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, standardFormat } from "@/lib/utils";

interface TopChannelsProps {
  stores?: Record<number, string>;
  data?: any[];
  targets?: any[];
  lmSales?: any[];
  lySales?: any[];
  totalSales?: Record<number, number>;
  StoreTargets?: any[];
  LYSalesItems?: Record<number, number>;
  LMSalesItems?: Record<number, number>;
  MTDBillCuts?: Record<number, number>;
  mtdSaleQty?: Record<number, number>;
  LYmtdSaleQty?: Record<number, number>;
  LYBillCuts?: Record<number, number>;
  scMap?: Record<number, number>;
  lsrMap?: Record<number, number>;
  netRevenueMap?: Record<number, number>;
  className?: string;
}

export default function TopChannels({
  stores = {},                    // must be an object, not []
  data = [],
  StoreTargets = [],
  totalSales = {},
  LYSalesItems = {},
  LMSalesItems = {},
  mtdSaleQty = {},
  LYmtdSaleQty = {},
  LYBillCuts = {},
  MTDBillCuts = {},
  className,
}: TopChannelsProps) {
  const today = new Date();
  const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysElapsed = today.getDate() - 1;

  // Always defined safe objects
  const safeTotalSales = totalSales ?? {};
  const safeStoreTargets = StoreTargets ?? [];
  const safeLYItems = LYSalesItems ?? {};
  const safeLMItems = LMSalesItems ?? {};
  const safeMtdQty = mtdSaleQty ?? {};
  const safeLYmtdQty = LYmtdSaleQty ?? {};
  const safeLYBillCuts = LYBillCuts ?? {};
  const safeMTDBillCuts = MTDBillCuts ?? {};

  // stores is already a Record<number, string>
  const storeNameMap: Record<number, string> = stores ?? {};

  /** GROUP DATA */
  const groupedData: Record<number, any> = {};
  (data ?? []).forEach((item) => {
    if (!item?.StoreCode) return;
    const code = Number(item.StoreCode);

    if (!groupedData[code]) {
      groupedData[code] = {
        ...item,
        Quantity: item.Quantity || 0,
        TotalSales: item.TotalSales || 0,
      };
    } else {
      groupedData[code].Quantity += item.Quantity || 0;
      groupedData[code].TotalSales += item.TotalSales || 0;
    }
  });

  const initialStores = Object.values(groupedData);
  const [sortAsc, setSortAsc] = useState(false);

  /** SORT STORES */
  const sortedStores = [...initialStores].sort((a, b) => {
    const aCode = Number(a.StoreCode);
    const bCode = Number(b.StoreCode);

    const monthTargetA =
      safeStoreTargets.find((t) => Number(t.StoreCode) === aCode)?.Target || 0;
    const monthTargetB =
      safeStoreTargets.find((t) => Number(t.StoreCode) === bCode)?.Target || 0;

    const mtdTargetA = Math.round((monthTargetA / totalDaysInMonth) * daysElapsed);
    const mtdTargetB = Math.round((monthTargetB / totalDaysInMonth) * daysElapsed);

    const achievedA = safeTotalSales[aCode] ?? 0;
    const achievedB = safeTotalSales[bCode] ?? 0;

    const achievedPercentA = mtdTargetA ? (achievedA / mtdTargetA) * 100 : 0;
    const achievedPercentB = mtdTargetB ? (achievedB / mtdTargetB) * 100 : 0;

    return sortAsc
      ? achievedPercentA - achievedPercentB
      : achievedPercentB - achievedPercentA;
  });

  const toggleSort = () => setSortAsc((x) => !x);

  /** GRAND TOTALS */
  const grandTotals = {
    totalTarget: safeStoreTargets
      .filter((t) => Number(t.StoreCode))
      .reduce((sum, t) => sum + (Number(t.Target) || 0), 0),

    totalAchieved: Object.entries(safeTotalSales)
      .filter(([code]) => Number(code))
      .reduce((sum, [, v]) => sum + v, 0),

    totalQty: Object.entries(safeMtdQty)
      .filter(([code]) => Number(code))
      .reduce((sum, [, v]) => sum + v, 0),

    totalBillCuts: Object.entries(safeMTDBillCuts)
      .filter(([code]) => Number(code))
      .reduce((sum, [, v]) => sum + v, 0),
  };

  return (
    <div
    className={cn(
      "relative w-full h-[75vh] overflow-x-auto overflow-y-auto rounded-lg shadow-lg bg-white p-2",
      className
    )}
  >
    {/* Horizontal Scroll Container */}
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[2000px] table-auto border-separate border-spacing-0">
        <TableHeader>
          <TableRow className="sticky top-0 z-30 bg-gray-100 shadow-md">
            {[
              "STORE NAME",
              "StoreCode",
              "MTD TARGET",
              "ACHIEVED",
              "ACHIEVED%",
              "AVG DAILY SALE",
              "GAP",
              "LY SALE MTD",
              "GOLY%",
              "LM MTD SALE",
              "GOLM%",
              "MONTH TARGET",
              "MTD SALES QTY",
              "LY MTD SALES QTY",
              "LY MTD SALES BILL CUTS",
              "MTD SALES BILL CUTS",
              "BILL CUT GOLY%",
              "ASP",
              "ABV",
              "IPT",
              "TOP RANKING STORE",
            ].map((col) => (
              <TableHead
                key={col}
                className={cn(
                  "px-3 py-2 text-sm font-semibold whitespace-nowrap border-b border-gray-200 bg-gray-100",
                  col === "STORE NAME" && "sticky left-0 z-40 bg-gray-100 text-left"
                )}
                style={{ cursor: col === "ACHIEVED%" ? "pointer" : "default" }}
                onClick={col === "ACHIEVED%" ? toggleSort : undefined}
              >
                {col} {col === "ACHIEVED%" && (sortAsc ? "↑" : "↓")}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* GRAND TOTAL ROW */}
          <TableRow className="bg-gray-200 font-semibold sticky top-[42px] z-20">
            <TableCell className="sticky left-0 bg-gray-200 px-3 py-2">
              GRAND TOTAL
            </TableCell>
            <TableCell className="px-3 py-2">-</TableCell>
            <TableCell className="px-3 py-2">
              {standardFormat(grandTotals.totalTarget)}
            </TableCell>
            <TableCell className="px-3 py-2">
              {standardFormat(grandTotals.totalAchieved)}
            </TableCell>
            <TableCell className="px-3 py-2">
              {grandTotals.totalTarget
                ? ((grandTotals.totalAchieved / grandTotals.totalTarget) * 100).toFixed(2) +
                  "%"
                : "0%"}
            </TableCell>
            <TableCell className="px-3 py-2">
              {daysElapsed > 0
                ? standardFormat(Math.round(grandTotals.totalAchieved / daysElapsed))
                : "-"}
            </TableCell>

            <TableCell className="px-3 py-2">
              {standardFormat(grandTotals.totalAchieved - grandTotals.totalTarget)}
            </TableCell>

            <TableCell className="px-3 py-2">
              {standardFormat(
                Object.values(safeLYItems).reduce((s, v) => s + v, 0)
              )}
            </TableCell>

            <TableCell className="px-3 py-2">
              {Object.values(safeLYItems).reduce((s, v) => s + v, 0)
                ? (
                    ((grandTotals.totalAchieved -
                      Object.values(safeLYItems).reduce((s, v) => s + v, 0)) /
                      Object.values(safeLYItems).reduce((s, v) => s + v, 0)) *
                    100
                  ).toFixed(2) + "%"
                : "0%"}
            </TableCell>

            <TableCell className="px-3 py-2">
              {standardFormat(
                Object.values(safeLMItems).reduce((s, v) => s + v, 0)
              )}
            </TableCell>

            <TableCell className="px-3 py-2">
              {Object.values(safeLMItems).reduce((s, v) => s + v, 0)
                ? (
                    ((grandTotals.totalAchieved -
                      Object.values(safeLMItems).reduce((s, v) => s + v, 0)) /
                      Object.values(safeLMItems).reduce((s, v) => s + v, 0)) *
                    100
                  ).toFixed(2) + "%"
                : "0%"}
            </TableCell>

            <TableCell className="px-3 py-2">
              {standardFormat(grandTotals.totalTarget)}
            </TableCell>

            <TableCell className="px-3 py-2">
              {standardFormat(grandTotals.totalQty)}
            </TableCell>

            <TableCell className="px-3 py-2">
              {standardFormat(Object.values(safeLYmtdQty).reduce((s, v) => s + v, 0))}
            </TableCell>

            <TableCell className="px-3 py-2">
              {standardFormat(Object.values(safeLYBillCuts).reduce((s, v) => s + v, 0))}
            </TableCell>

            <TableCell className="px-3 py-2">
              {standardFormat(grandTotals.totalBillCuts)}
            </TableCell>

            <TableCell className="px-3 py-2">
              {Object.values(safeLYBillCuts).reduce((s, v) => s + v, 0)
                ? (
                    ((grandTotals.totalBillCuts -
                      Object.values(safeLYBillCuts).reduce((s, v) => s + v, 0)) /
                      Object.values(safeLYBillCuts).reduce((s, v) => s + v, 0)) *
                    100
                  ).toFixed(2) + "%"
                : "0%"}
            </TableCell>

            <TableCell className="px-3 py-2">
              {grandTotals.totalQty
                ? (grandTotals.totalAchieved / grandTotals.totalQty).toFixed(2)
                : "-"}
            </TableCell>

            <TableCell className="px-3 py-2">
              {grandTotals.totalBillCuts
                ? (grandTotals.totalAchieved / grandTotals.totalBillCuts).toFixed(2)
                : "-"}
            </TableCell>

            <TableCell className="px-3 py-2">
              {grandTotals.totalBillCuts
                ? (grandTotals.totalQty / grandTotals.totalBillCuts).toFixed(2)
                : "-"}
            </TableCell>

            <TableCell className="px-3 py-2">-</TableCell>
          </TableRow>

          {/* STORE ROWS */}
          {sortedStores.map((store, idx) => {
            const code = Number(store.StoreCode);

            const monthTarget =
              safeStoreTargets.find((t) => Number(t.StoreCode) === code)?.Target ||
              0;

            const mtdTarget = Math.round(
              (monthTarget / totalDaysInMonth) * daysElapsed
            );

            const achieved = safeTotalSales[code] ?? 0;

            const achievedPercent = mtdTarget
              ? (achieved / mtdTarget) * 100
              : 0;

            const avgDaily = daysElapsed > 0 ? achieved / daysElapsed : 0;
            const gap = achieved - monthTarget;

            const lyMtd = safeLYItems[code] ?? 0;
            const lmMtd = safeLMItems[code] ?? 0;

            const mtdQtyVal = safeMtdQty[code] ?? 0;
            const lyQtyVal = safeLYmtdQty[code] ?? 0;

            const lyBillCutsVal = safeLYBillCuts[code] ?? 0;
            const mtdBillCutsVal = safeMTDBillCuts[code] ?? 0;

            const golyPercent = lyMtd ? ((achieved - lyMtd) / lyMtd) * 100 : 0;
            const golmPercent = lmMtd ? ((achieved - lmMtd) / lmMtd) * 100 : 0;

            const billCutGOLY = lyBillCutsVal
              ? ((mtdBillCutsVal - lyBillCutsVal) / lyBillCutsVal) * 100
              : 0;

            const ASP = mtdQtyVal ? achieved / mtdQtyVal : 0;
            const ABV = mtdBillCutsVal ? achieved / mtdBillCutsVal : 0;
            const IPT = mtdBillCutsVal ? mtdQtyVal / mtdBillCutsVal : 0;

            const rank = idx + 1;

            const achievedColor =
              achievedPercent < 85
                ? "text-red-500"
                : achievedPercent < 100
                ? "text-yellow-500"
                : "text-green-600";

            const golyColor = golyPercent < 0 ? "text-red-500" : "text-green-600";
            const golmColor = golmPercent < 0 ? "text-red-500" : "text-green-600";
            const billCutColor =
              billCutGOLY < 0 ? "text-red-500" : "text-green-600";

            const rankColor =
              rank <= 3
                ? "text-green-600 font-bold"
                : rank > sortedStores.length - 3
                ? "text-red-600 font-bold"
                : "";

            return (
              <TableRow
                key={idx}
                className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <TableCell className="sticky left-0 bg-white px-3 py-2 font-medium">
                  {storeNameMap[code] || "Unknown Store"}
                </TableCell>

                <TableCell className="px-3 py-2">{standardFormat(code)}</TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(monthTarget)}
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(achieved)}
                </TableCell>

                <TableCell className={`px-3 py-2 font-semibold ${achievedColor}`}>
                  {achievedPercent.toFixed(2)}%
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(Math.round(avgDaily))}
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(Math.round(gap))}
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(lyMtd)}
                </TableCell>

                <TableCell className={`px-3 py-2 ${golyColor}`}>
                  {golyPercent.toFixed(2)}%
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(lmMtd)}
                </TableCell>

                <TableCell className={`px-3 py-2 ${golmColor}`}>
                  {golmPercent.toFixed(2)}%
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(monthTarget)}
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(mtdQtyVal)}
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(lyQtyVal)}
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(lyBillCutsVal)}
                </TableCell>

                <TableCell className="px-3 py-2">
                  {standardFormat(mtdBillCutsVal)}
                </TableCell>

                <TableCell className={`px-3 py-2 ${billCutColor}`}>
                  {billCutGOLY.toFixed(2)}%
                </TableCell>

                <TableCell className="px-3 py-2">{ASP.toFixed(2)}</TableCell>
                <TableCell className="px-3 py-2">{ABV.toFixed(2)}</TableCell>
                <TableCell className="px-3 py-2">{IPT.toFixed(2)}</TableCell>

                <TableCell className={`px-3 py-2 ${rankColor}`}>{rank}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}
