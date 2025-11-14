// components/CategoryClassificationReport.tsx
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { fetchABCReport } from "@/store/abcCategorySlice";

type Option = { label: string; value: string };
type SortDirection = "asc" | "desc" | null;

function pct(v?: number) {
  if (v === null || v === undefined || Number.isNaN(v)) return "0.00%";
  return `${Number(v).toFixed(2)}%`;
}
function fmt(v?: number) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString();
}

export default function CategoryClassificationReport({
  storeCode = 5,
  startDate = "2025-08-01",
  endDate = "2025-10-31",
}: {
  storeCode?: number;
  startDate?: string;
  endDate?: string;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    abcData = [],
    page = 1,
    limit = 20,
    total_count = 0,
    totalPages = 1,
    category_summary = null,
    status,
  } = useSelector((s: RootState) => s.categoryClassification as any);

  // filters
  const [brand, setBrand] = useState<string | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [abcCategory, setAbcCategory] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");

  // sorting (client chooses column, server does sorting) — SaleQty is not allowed for client sort.
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // options data (populated from API one large page)
  const [optionsData, setOptionsData] = useState<any[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // init guard to avoid double requests
  const initialized = useRef(false);

  // fetch page
  const fetchPage = useCallback(
    (p = 1) =>
      dispatch(
        fetchABCReport({
          storeCode,
          startDate,
          endDate,
          brand,
          product,
          department,
          className,
          abcCategory,
          query,
          sortBy,
          sortDirection,
          page: p,
          limit,
        })
      ),
    [
      dispatch,
      storeCode,
      startDate,
      endDate,
      brand,
      product,
      department,
      className,
      abcCategory,
      query,
      sortBy,
      sortDirection,
      limit,
    ]
  );

  // fetch options (one big request to populate dropdowns)
  const fetchOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const body = { storeCode, startDate, endDate, page: 1, limit: 1000 };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/debug/abc-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setOptionsData(json.ABCData ?? []);
    } catch (err) {
      setOptionsData([]);
    } finally {
      setOptionsLoading(false);
    }
  }, [storeCode, startDate, endDate]);

  // initial load once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchOptions();
    fetchPage(1);
  }, [fetchOptions, fetchPage]);

  // re-fetch when filters / sorting change (server-side)
  useEffect(() => {
    if (!initialized.current) return;
    fetchPage(1);
  }, [brand, product, department, className, abcCategory, query, sortBy, sortDirection, fetchPage]);

  // dropdown options derivation
  const brandOptions: Option[] = useMemo(() => {
    const s = new Set<string>();
    for (const r of optionsData) if (r.BrandName) s.add(String(r.BrandName));
    return [...s].sort().map((v) => ({ label: v, value: v }));
  }, [optionsData]);

  const productOptions: Option[] = useMemo(() => {
    const s = new Set<string>();
    for (const r of optionsData) {
      if (brand && r.BrandName !== brand) continue;
      if (r.ProductName) s.add(String(r.ProductName));
    }
    return [...s].sort().map((v) => ({ label: v, value: v }));
  }, [optionsData, brand]);

  const departmentOptions: Option[] = useMemo(() => {
    const s = new Set<string>();
    for (const r of optionsData) {
      if (brand && r.BrandName !== brand) continue;
      if (r.Department) s.add(String(r.Department));
    }
    return [...s].sort().map((v) => ({ label: v, value: v }));
  }, [optionsData, brand]);

  const classOptions: Option[] = useMemo(() => {
    const s = new Set<string>();
    for (const r of optionsData) {
      if (brand && r.BrandName !== brand) continue;
      if (r.Class) s.add(String(r.Class));
    }
    return [...s].sort().map((v) => ({ label: v, value: v }));
  }, [optionsData, brand]);

  const abcOptions = [
    { label: "A Category", value: "A" },
    { label: "B Category", value: "B" },
    { label: "C Category", value: "C" },
  ];

  // clear filters
  const clearFilters = () => {
    setBrand(null);
    setProduct(null);
    setDepartment(null);
    setClassName(null);
    setAbcCategory(null);
    setQuery("");
    setSortBy(null);
    setSortDirection(null);
    fetchOptions();
    fetchPage(1);
  };

  // pagination
  const handlePrev = () => page > 1 && fetchPage(page - 1);
  const handleNext = () => page < totalPages && fetchPage(page + 1);

  // sorting handler (client toggles, but SaleQty sort disabled)
  const handleSort = (col: string) => {
    if (col === "SaleQty") return; // disallowed
    if (sortBy === col) {
      const next = sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc";
      setSortDirection(next);
      if (next === null) setSortBy(null);
    } else {
      setSortBy(col);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (col: string) => {
    if (sortBy !== col) return null;
    return sortDirection === "asc" ? "▲" : "▼";
  };

  // --- cards for category summary ---
  const SummaryCard = ({ title, data, color }: { title: string; data: any; color: string }) => {
    return (
      <div className="rounded-xl border p-3 bg-white shadow-sm flex-1 min-w-[180px]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">{title}</div>
            <div className="text-xl font-bold mt-1">{data?.total_skus ?? 0} SKUs</div>
            <div className="text-sm text-gray-600 mt-1">
              In stock: <span className="font-semibold">{data?.in_stock ?? 0}</span>
              {" • "}
              Out: <span className="font-semibold">{data?.out_of_stock ?? 0}</span>
            </div>
          </div>
          <div className={`ml-3 rounded-full px-3 py-1 text-sm font-semibold ${color}`}>
            {data ? `${data.in_stock_ratio_pct ?? 0}%` : "0%"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 md:p-5 space-y-5">
      {/* header + cards */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ABC Classification Report</h2>
          <div className="text-xs text-gray-500">Store <span className="font-medium">{storeCode}</span> • {startDate} → {endDate}</div>
        </div>

        {/* category cards */}
        <div className="flex gap-3 items-stretch w-full md:w-auto">
          <SummaryCard title="Category A" data={category_summary?.A} color="bg-red-100 text-red-700" />
          <SummaryCard title="Category B" data={category_summary?.B} color="bg-yellow-100 text-yellow-700" />
          <SummaryCard title="Category C" data={category_summary?.C} color="bg-green-100 text-green-700" />
        </div>
      </div>

      {/* filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <Select
          isClearable
          isSearchable
          placeholder={optionsLoading ? "Loading brands..." : "Brand"}
          options={brandOptions}
          value={brand ? { label: brand, value: brand } : null}
          onChange={(v) => { setBrand(v ? v.value : null); setProduct(null); setDepartment(null); setClassName(null); }}
          className="text-sm"
        />
        <Select
          isClearable
          isSearchable
          placeholder="Product"
          options={productOptions}
          value={product ? { label: product, value: product } : null}
          onChange={(v) => setProduct(v ? v.value : null)}
          className="text-sm"
        />
        <Select
          isClearable
          isSearchable
          placeholder="Department"
          options={departmentOptions}
          value={department ? { label: department, value: department } : null}
          onChange={(v) => setDepartment(v ? v.value : null)}
          className="text-sm"
        />
        <Select
          isClearable
          isSearchable
          placeholder="Class"
          options={classOptions}
          value={className ? { label: className, value: className } : null}
          onChange={(v) => setClassName(v ? v.value : null)}
          className="text-sm"
        />
        <Select
          isClearable
          placeholder="ABC Category"
          options={abcOptions}
          value={abcCategory ? { label: `Category ${abcCategory}`, value: abcCategory } : null}
          onChange={(v) => setAbcCategory(v ? v.value : null)}
          className="text-sm"
        />
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="rounded-lg border px-3 py-2 text-sm w-full" />
          <button onClick={() => fetchPage(1)} className="rounded-lg bg-primary text-white px-3 py-2 text-sm">Apply</button>
          <button onClick={clearFilters} className="rounded-lg border px-3 py-2 text-sm">Clear</button>
        </div>
      </div>

      {/* table */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table className="min-w-[1000px] w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="sticky top-0 z-10 bg-gray-100 text-gray-700">
                {[
                  { key: "BrandName", label: "Brand", align: "left" },
                  { key: "ProductName", label: "Product", align: "left" },
                  { key: "Department", label: "Department", align: "left" },
                  { key: "Class", label: "Class", align: "left" },
                  { key: "SalePercent", label: "% of Dept", align: "right" },
                  { key: "CumulativePercent", label: "Cumulative %", align: "right" },
                  { key: "SaleQty", label: "Sale Qty", align: "right", sortable: false }, // not sortable by user
                  { key: "Sale3Months", label: "3M Sale (₹)", align: "right" },
                  { key: "StockQty", label: "Stock Qty", align: "right" },
                  { key: "DaysLeft", label: "Days Left", align: "right" },
                  { key: "ABC_Category", label: "ABC", align: "center" },
                ].map((col) => (
                  <th key={col.key} className={`border p-2 ${col.align === "right" ? "text-right" : "text-left"} select-none cursor-pointer`} onClick={() => col.sortable !== false && handleSort(col.key)}>
                    <div className="flex items-center justify-between">
                      <span>{col.label}</span>
                      <span className="text-[11px] opacity-80">{(col.sortable === false) ? null : renderSortIcon(col.key)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {status === "loading" ? (
                <tr><td colSpan={11} className="p-6 text-center text-gray-500">Loading data...</td></tr>
              ) : abcData.length === 0 ? (
                <tr><td colSpan={11} className="p-6 text-center text-gray-500">No data found</td></tr>
              ) : (
                abcData.map((row: any, i: number) => (
                  <tr key={`${row.ProductCode}-${i}`} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}>
                    <td className="border p-2 font-semibold">{row.BrandName}</td>
                    <td className="border p-2">{row.ProductName}</td>
                    <td className="border p-2">{row.Department}</td>
                    <td className="border p-2">{row.Class}</td>
                    <td className="border p-2 text-right">{pct(row.SalePercent)}</td>
                    <td className="border p-2 text-right text-blue-700">{pct(row.CumulativePercent)}</td>
                    <td className="border p-2 text-right">{fmt(row.SaleQty)}</td>
                    <td className="border p-2 text-right text-yellow-700">₹ {fmt(row.Sale3Months)}</td>
                    <td className="border p-2 text-right text-green-700">{fmt(row.StockQty)}</td>
                    <td className={`border p-2 text-right font-semibold ${row.DaysLeft > 90 ? "text-green-700" : row.DaysLeft < 30 ? "text-red-600" : "text-yellow-700"}`}>{row.DaysLeft === 9999 ? "—" : fmt(row.DaysLeft)}</td>
                    <td className="border p-2 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${row.ABC_Category === "A" ? "bg-red-100 text-red-700" : row.ABC_Category === "B" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{row.ABC_Category}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
        <div className="text-gray-600 text-center sm:text-left">
          Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> — total <span className="font-semibold">{fmt(total_count)}</span> rows
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <button onClick={handlePrev} disabled={page <= 1 || status === "loading"} className="flex-1 sm:flex-none rounded-lg border px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-60">← Previous</button>
          <button onClick={handleNext} disabled={page >= totalPages || status === "loading"} className="flex-1 sm:flex-none rounded-lg border px-4 py-2 text-white bg-primary hover:bg-primary/90 disabled:opacity-60">Next →</button>
        </div>
      </div>
    </div>
  );
}
