"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchStores, StoreItem } from "@/store/storesSlice";
import { formatLocalDate } from "@/lib/utils";
import { fetchABCReport } from "@/store/abcCategorySlice";
import CategoryClassificationReport from "./CategoryClassificationReport";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

export default function CategoryClassificationReportPage() {
  const dispatch = useDispatch<AppDispatch>();

  // -------------------- STORE FETCH --------------------
  const { items: stores = [], status: storeStatus } = useSelector(
    (state: RootState) => state.stores
  );

  // -------------------- STATE --------------------
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // -------------------- EXCLUDED STORES --------------------
  const exclude = new Set([
    1, 2, 3, 4, 18, 19, 20, 21, 22, 23, 26,
    30, 32, 33, 37, 42, 47, 59, 60, 62, 66,
  ]);

  // -------------------- VALID STORES --------------------
  const validStores: StoreItem[] = useMemo(() => {
    return stores
      .filter(
        (s: StoreItem) =>
          s.StoreName?.trim() && !exclude.has(Number(s.StoreCode))
      )
      .sort((a, b) => Number(a.StoreCode) - Number(b.StoreCode));
  }, [stores]);

  // -------------------- FETCH STORES --------------------
  useEffect(() => {
    if (storeStatus === "idle") dispatch(fetchStores());
  }, [storeStatus, dispatch]);

  // -------------------- DEFAULT STORE SELECTION --------------------
  useEffect(() => {
    if (validStores.length > 0 && !selectedStore) {
      setSelectedStore(Number(validStores[0].StoreCode));
    }
  }, [validStores]);

  // -------------------- LAST 3 MONTHS RANGE --------------------
  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);

    setStartDate(formatLocalDate(start));
    setEndDate(formatLocalDate(end));
  }, []);

  // -------------------- APPLY --------------------
  const handleApply = () => {
    if (!selectedStore) return;

    console.log({
      storeCode: selectedStore,
      startDate,
      endDate,
    });

    dispatch(
    fetchABCReport({
      storeCode: selectedStore,
      startDate,
      endDate,
    })
  );
  
    // 👉 Call API here
    // dispatch(fetchCategoryClassificationReport({ storeCode, startDate, endDate }));
  };

  // -------------------- UI --------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="mx-auto max-w-full">

        <Breadcrumb pageName="Category Wise Classification" />


        {/* FILTER CARD */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:p-6">
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* STORE SELECT */}
            <div className="w-full">
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Store
              </label>
              <select
                value={selectedStore ?? ""}
                onChange={(e) => setSelectedStore(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium shadow-sm transition hover:border-indigo-400 focus:ring-2 focus:ring-indigo-400"
              >
                {validStores.map((s) => (
                  <option key={s.StoreCode} value={s.StoreCode}>
                    {s.StoreName} - {s.StoreCode}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE RANGE (READONLY) */}
            <div className="w-full">
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Date Range (Last 3 Months)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  disabled
                  value={startDate}
                  className="rounded-xl border border-gray-300 bg-gray-100 px-2 py-2 text-sm"
                />
                <input
                  type="date"
                  disabled
                  value={endDate}
                  className="rounded-xl border border-gray-300 bg-gray-100 px-2 py-2 text-sm"
                />
              </div>
            </div>

            {/* APPLY BUTTON */}
            <div className="flex items-end">
              <button
                onClick={handleApply}
                className="w-full rounded-xl bg-primary px-6 py-2.5 font-medium text-white shadow-md transition hover:bg-primary/90 focus:ring-2 focus:ring-orange-300"
              >
                Apply
              </button>
            </div>

          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {/* Your table / report component will come here */}
          <p className="text-center text-gray-400 py-10">
            <CategoryClassificationReport />
          </p>
        </div>
      </div>
    </div>
  );
}
