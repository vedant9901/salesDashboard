"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, standardFormat } from "@/lib/utils";

interface StorePerformanceTableProps {
  storeOptions: Array<[number, string]>; // [[StoreCode, StoreName]]
  totalSalesClient: number; // total sales across all stores (for reference)
  totalTargetClient: number;
  percentAchievedClient: number;
  lmMtdClient: number;
  lyClient: number;
  mtdGrowthClient: number;
  mtdIPT: number;
  lyTotalBills: number;
  mtdTotalBills: number;
  className?: string;
}

export default function StorePerformanceTable({
  storeOptions,
  totalSalesClient,
  totalTargetClient,
  percentAchievedClient,
  lmMtdClient,
  lyClient,
  mtdGrowthClient,
  mtdIPT,
  lyTotalBills,
  mtdTotalBills,
  className,
}: StorePerformanceTableProps) {
  const columns = [
    "STORE NAME",
    "MTD TARGET",
    "ACHIEVED",
    "ACHIEVED%",
    "AVG DAILY SALE",
    "GAP",
    "LY SALE MTD",
    "LM MTD SALE",
    "GOLM%",
    "LY MTD BILL COUNT",
    "MTD BILL COUNT",
    "IPT",
  ];

  const formatValue = (val?: number) => (val != null ? standardFormat(val) : "-");

  const currentDayOfMonth = new Date().getDate();

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg bg-white shadow-sm dark:bg-gray-dark dark:shadow-card",
        className
      )}
    >
      <Table className="min-w-[1200px]">
        <TableHeader className="sticky top-0 z-10 bg-white dark:bg-gray-dark">
          <TableRow className="[&>th]:text-center border-b border-gray-200 dark:border-gray-700">
            {columns.map((col) => (
              <TableHead
                key={col}
                className={col === "STORE NAME" ? "!text-left px-3 py-2" : "px-2 py-2"}
              >
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {storeOptions.map(([storeCode, storeName]) => {
            // For demo, using same totals for each store — replace with per-store calculations if available
            const avgDailySale = totalTargetClient / currentDayOfMonth;
            const gap = totalTargetClient - totalSalesClient;

            return (
              <TableRow
                key={storeCode}
                className="text-center text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <TableCell className="!text-left px-3 py-1">{storeName}</TableCell>
                <TableCell className="px-2 py-1">₹{formatValue(totalTargetClient)}</TableCell>
                <TableCell className="px-2 py-1 text-green-600">
                  ₹{formatValue(totalSalesClient)}
                </TableCell>
                <TableCell className="px-2 py-1">{percentAchievedClient.toFixed(1)}%</TableCell>
                <TableCell className="px-2 py-1">{formatValue(avgDailySale)}</TableCell>
                <TableCell className="px-2 py-1">{formatValue(gap)}</TableCell>
                <TableCell className="px-2 py-1">{formatValue(lyClient)}</TableCell>
                <TableCell className="px-2 py-1">{formatValue(lmMtdClient)}</TableCell>
                <TableCell className="px-2 py-1">{formatValue(mtdGrowthClient)}%</TableCell>
                <TableCell className="px-2 py-1">{formatValue(lyTotalBills)}</TableCell>
                <TableCell className="px-2 py-1">{formatValue(mtdTotalBills)}</TableCell>
                <TableCell className="px-2 py-1">{formatValue(mtdIPT)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
