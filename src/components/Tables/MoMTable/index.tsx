"use client";

import { getLast13Months } from "@/lib/utils";
import { computeMonthlySales } from "@/lib/utils";

interface MoMTableProps {
  salesData: any[]; // raw OverallSalesItems
  storeName?: string; // optional
}

export const MoMTable = ({ salesData, storeName = "All Stores" }: MoMTableProps) => {
  // --- Get last 13 months for table
  const months = getLast13Months();

  // --- Compute total sales per month
  const monthlySales = computeMonthlySales(salesData, months);

  // --- Compute MoM growth %
  const momWithGrowth = monthlySales.map((curr, idx, arr) => {
    const prev = idx > 0 ? arr[idx - 1].totalSales : null;
    return {
      ...curr,
      growth: prev ? ((curr.totalSales - prev) / prev) * 100 : null,
    };
  });

  return (
    <div className="overflow-x-auto">
      <h3 className="mb-2 text-lg font-semibold">{storeName} - Last 13 Months</h3>
      <table className="min-w-full table-auto border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2 text-left">Month</th>
            <th className="border px-3 py-2 text-right">Total Sales</th>
            <th className="border px-3 py-2 text-right">MoM Growth %</th>
          </tr>
        </thead>
        <tbody>
          {momWithGrowth.map((m) => (
            <tr key={m.month}>
              <td className="border px-3 py-2">{m.month}</td>
              <td className="border px-3 py-2 text-right">
                {m.totalSales.toLocaleString()}
              </td>
              <td className="border px-3 py-2 text-right">
                {m.growth !== null ? m.growth.toFixed(2) + "%" : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
