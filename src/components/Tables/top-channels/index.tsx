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
  stores: any[];
  data: any[];
  StoreTargets: any[];
  totalSales: Record<number, number>;
  LYSalesItems: Record<number, number>;
  LMSalesItems: Record<number, number>;
  mtdSaleQty: Record<number, number>;
  LYmtdSaleQty: Record<number, number>;
  LYBillCuts: Record<number, number>;
  MTDBillCuts: Record<number, number>;
  className?: string;
}

export default function TopChannels({
  stores,
  data,
  StoreTargets,
  totalSales,
  LYSalesItems,
  LMSalesItems,
  mtdSaleQty,
  LYmtdSaleQty,
  LYBillCuts,
  MTDBillCuts,
  className,
}: TopChannelsProps) {
  const today = new Date();
  const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysElapsed = today.getDate() - 1;

  const storeNameMap: Record<number, string> = stores.reduce((acc, s) => {
    acc[Number(s[0])] = s[1];
    return acc;
  }, {} as Record<number, string>);

  // group data by store
  const groupedData: Record<number, any> = {};
  data.forEach((item) => {
    if (!item.StoreCode) return;
    const code = Number(item.StoreCode);
    if (!groupedData[code])
      groupedData[code] = { ...item, Quantity: item.Quantity || 0, TotalSales: item.TotalSales || 0 };
    else {
      groupedData[code].Quantity += item.Quantity || 0;
      groupedData[code].TotalSales += item.TotalSales || 0;
    }
  });

  const initialStores = Object.values(groupedData);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const sortedStores = [...initialStores].sort((a, b) => {
    const aCode = Number(a.StoreCode);
    const bCode = Number(b.StoreCode);

    const monthTargetA = StoreTargets.find((t) => Number(t.StoreCode) === aCode)?.Target || 0;
    const monthTargetB = StoreTargets.find((t) => Number(t.StoreCode) === bCode)?.Target || 0;

    const mtdTargetA = Math.round((monthTargetA / totalDaysInMonth) * daysElapsed);
    const mtdTargetB = Math.round((monthTargetB / totalDaysInMonth) * daysElapsed);

    const achievedA = totalSales[aCode] || 0;
    const achievedB = totalSales[bCode] || 0;

    const achievedPercentA = mtdTargetA ? (achievedA / mtdTargetA) * 100 : 0;
    const achievedPercentB = mtdTargetB ? (achievedB / mtdTargetB) * 100 : 0;

    return sortAsc ? achievedPercentA - achievedPercentB : achievedPercentB - achievedPercentA;
  });

  const toggleSort = () => setSortAsc(!sortAsc);

  // --- Compute Grand Totals
 const grandTotals = {
  totalTarget: StoreTargets
    .filter(t => !isNaN(Number(t.StoreCode)) && t.StoreCode !== "") // only numeric StoreCodes
    .reduce((sum, t) => sum + (Number(t.Target) || 0), 0),

  totalAchieved: Object.entries(totalSales)
    .filter(([storeCode]) => !isNaN(Number(storeCode)) && storeCode !== "")
    .reduce((sum, [, v]) => sum + v, 0),

  totalQty: Object.entries(mtdSaleQty)
    .filter(([storeCode]) => !isNaN(Number(storeCode)) && storeCode !== "")
    .reduce((sum, [, v]) => sum + v, 0),

  totalBillCuts: Object.entries(MTDBillCuts)
    .filter(([storeCode]) => !isNaN(Number(storeCode)) && storeCode !== "")
    .reduce((sum, [, v]) => sum + v, 0),
};

  return (
    <div
  className={cn(
    "relative w-full h-[75vh] overflow-x-hidden  rounded-lg shadow-lg bg-white p-2",
    className
  )}
>
  <Table className="min-w-[1800px] table-auto border-separate border-spacing-0">
    {/* === HEADER === */}
    <TableHeader>
      <TableRow className="sticky top-0 z-30 bg-gray-100 shadow-md">
        {[
          "STORE NAME", "StoreCode", "MTD TARGET", "ACHIEVED", "ACHIEVED%", "AVG DAILY SALE", "GAP",
          "LY SALE MTD", "GOLY%", "LM MTD SALE", "GOLM%", "MONTH TARGET", "MTD SALES QTY",
          "LY MTD SALES QTY", "LY MTD SALES BILL CUTS", "MTD SALES BILL CUTS", "BILL CUT GOLY%",
          "ASP", "ABV", "IPT", "TOP RANKING STORE",
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

    {/* === BODY === */}
    <TableBody>
      {/* --- GRAND TOTAL ROW --- */}
      <TableRow className="bg-gray-200 font-semibold sticky top-[42px] z-20">
        <TableCell className="sticky left-0 bg-gray-200 px-3 py-2">GRAND TOTAL</TableCell>
        <TableCell className="px-3 py-2">-</TableCell>
        <TableCell className="px-3 py-2">{standardFormat(grandTotals.totalTarget)}</TableCell>
        <TableCell className="px-3 py-2">{standardFormat(grandTotals.totalAchieved)}</TableCell>
        <TableCell className="px-3 py-2">
          {grandTotals.totalTarget
            ? ((grandTotals.totalAchieved / grandTotals.totalTarget) * 100).toFixed(2) + "%"
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
          {standardFormat(Object.values(LYSalesItems).reduce((s, v) => s + v, 0))}
        </TableCell>
        <TableCell className="px-3 py-2">
          {Object.values(LYSalesItems).reduce((s, v) => s + v, 0)
            ? (
                ((grandTotals.totalAchieved -
                  Object.values(LYSalesItems).reduce((s, v) => s + v, 0)) /
                  Object.values(LYSalesItems).reduce((s, v) => s + v, 0)) *
                100
              ).toFixed(2) + "%"
            : "0%"}
        </TableCell>
        <TableCell className="px-3 py-2">
          {standardFormat(Object.values(LMSalesItems).reduce((s, v) => s + v, 0))}
        </TableCell>
        <TableCell className="px-3 py-2">
          {Object.values(LMSalesItems).reduce((s, v) => s + v, 0)
            ? (
                ((grandTotals.totalAchieved -
                  Object.values(LMSalesItems).reduce((s, v) => s + v, 0)) /
                  Object.values(LMSalesItems).reduce((s, v) => s + v, 0)) *
                100
              ).toFixed(2) + "%"
            : "0%"}
        </TableCell>
        <TableCell className="px-3 py-2">{standardFormat(grandTotals.totalTarget)}</TableCell>
        <TableCell className="px-3 py-2">{standardFormat(grandTotals.totalQty)}</TableCell>
        <TableCell className="px-3 py-2">
          {standardFormat(Object.values(LYmtdSaleQty).reduce((s, v) => s + v, 0))}
        </TableCell>
        <TableCell className="px-3 py-2">
          {standardFormat(Object.values(LYBillCuts).reduce((s, v) => s + v, 0))}
        </TableCell>
        <TableCell className="px-3 py-2">
          {grandTotals.totalBillCuts}
          {/* {standardFormat(Object.values(LYBillCuts).reduce((s, v) => s + v, 0))} */}
        </TableCell>
        <TableCell className="px-3 py-2">
          {Object.values(LYBillCuts).reduce((s, v) => s + v, 0)
            ? (
                ((grandTotals.totalBillCuts -
                  Object.values(LYBillCuts).reduce((s, v) => s + v, 0)) /
                  Object.values(LYBillCuts).reduce((s, v) => s + v, 0)) *
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

      {/* --- STORE ROWS --- */}
      {sortedStores.map((store, idx) => {
        const code = Number(store.StoreCode);
        const monthTarget = StoreTargets.find((t) => Number(t.StoreCode) === code)?.Target || 0;
        const mtdTarget = Math.round((monthTarget / totalDaysInMonth) * daysElapsed);
        const achieved = totalSales[code] || 0;
        const achievedPercent = mtdTarget ? (achieved / mtdTarget) * 100 : 0;
        const avgDaily = daysElapsed > 0 ? achieved / daysElapsed : 0;
        const gap = achieved - monthTarget;

        const lyMtd = LYSalesItems[code] || 0;
        const lmMtd = LMSalesItems[code] || 0;
        const mtdQty = mtdSaleQty[code] || 0;
        const LymtdQty = LYmtdSaleQty[code] || 0;
        const LymtdBillcuts = LYBillCuts[code] || 0;
        const MtdBillcuts = MTDBillCuts[code] || 0;

        const golyPercent = lyMtd ? ((achieved - lyMtd) / lyMtd) * 100 : 0;
        const golmPercent = lmMtd ? ((achieved - lmMtd) / lmMtd) * 100 : 0;
        const billCutGOLY = LymtdBillcuts
          ? ((MtdBillcuts - LymtdBillcuts) / LymtdBillcuts) * 100
          : 0;

        const ASP = mtdQty ? achieved / mtdQty : 0;
        const ABV = MtdBillcuts ? achieved / MtdBillcuts : 0;
        const IPT = MtdBillcuts ? mtdQty / MtdBillcuts : 0;

        const achievedColor =
          achievedPercent < 85
            ? "text-red-500"
            : achievedPercent < 100
            ? "text-yellow-500"
            : "text-green-600";

        const golyColor = golyPercent < 0 ? "text-red-500" : "text-green-600";
        const golmColor = golmPercent < 0 ? "text-red-500" : "text-green-600";
        const billCutColor = billCutGOLY < 0 ? "text-red-500" : "text-green-600";

        const rank = idx + 1;
        const rankColor =
          rank <= 3
            ? "text-green-600 font-bold"
            : rank > sortedStores.length - 3
            ? "text-red-600 font-bold"
            : "";

        return (
          <TableRow key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
            <TableCell className="sticky left-0 bg-white px-3 py-2 font-medium">
              {storeNameMap[code] || "Unknown Store"}
            </TableCell>
            <TableCell className="px-3 py-2">{standardFormat(code)}</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(monthTarget)}</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(achieved)}</TableCell>
            <TableCell className={`px-3 py-2 font-semibold ${achievedColor}`}>
              {achievedPercent.toFixed(2)}%
            </TableCell>
            <TableCell className="px-3 py-2">{standardFormat(Math.round(avgDaily))}</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(Math.round(gap))}</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(lyMtd)}</TableCell>
            <TableCell className={`px-3 py-2 ${golyColor}`}>{golyPercent.toFixed(2)}%</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(lmMtd)}</TableCell>
            <TableCell className={`px-3 py-2 ${golmColor}`}>{golmPercent.toFixed(2)}%</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(monthTarget)}</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(mtdQty)}</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(LymtdQty)}</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(LymtdBillcuts)}</TableCell>
            <TableCell className="px-3 py-2">{standardFormat(MtdBillcuts)}</TableCell>
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

  );
}
