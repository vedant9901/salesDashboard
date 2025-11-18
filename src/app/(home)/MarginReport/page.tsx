"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchStores, StoreItem } from "@/store/storesSlice";
import { fetchMarginReport, fetchMoMReport } from "@/store/marginReportSlice";
import { formatLocalDate } from "@/lib/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import MarginReportClient from "./MarginReportClient";

export default function Dashboard2Page() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: stores = [], status: storesStatus } = useSelector(
    (state: RootState) => state.stores,
  );

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // -------------------- STATE --------------------
  const [selectedStores, setSelectedStores] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(formatLocalDate(firstDayOfMonth));
  const [endDate, setEndDate] = useState(formatLocalDate(today));
  const [dateFilter, setDateFilter] = useState("15days");

  const [tempSelectedStores, setTempSelectedStores] = useState<number[]>([]);
  const [tempStartDate, setTempStartDate] = useState(
    formatLocalDate(firstDayOfMonth),
  );
  const [tempEndDate, setTempEndDate] = useState(formatLocalDate(today));
  const [tempDateFilter, setTempDateFilter] = useState("15days");

  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toggleValue, setToggleValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );

  const storeDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const hasInitialLoaded = useRef(false);
  const hasAppliedMoMRef = useRef(false);

  // -------------------- EXCLUDED STORES --------------------
  const storesToExclude = [
    1, 2, 3, 4, 18, 19, 20, 21, 22, 23, 26, 30, 32, 33, 37, 42, 47, 59, 60, 62,
    66,
  ];
  const storesToExcludeSet = useMemo(() => new Set(storesToExclude), []);

  // -------------------- FETCH STORES --------------------
  useEffect(() => {
    if (storesStatus === "idle") dispatch(fetchStores());
  }, [dispatch, storesStatus]);

  // -------------------- VALID STORES --------------------
  const validStores: StoreItem[] = useMemo(() => {
    return stores
      .filter((s) => {
        const code = Number(s.StoreCode);
        return s.StoreName?.trim() && !storesToExcludeSet.has(code);
      })
      .sort((a, b) => a.StoreCode - b.StoreCode);
  }, [stores, storesToExcludeSet]);

  const storeMap = useMemo(() => {
    const map: Record<number, string> = {};
    validStores.forEach((s) => {
      const code = Number(s.StoreCode);
      map[code] = `${s.StoreName} - ${code}`;
    });
    return map;
  }, [validStores]);

  // -------------------- DEFAULT STORE SELECTION --------------------
  useEffect(() => {
    if (validStores.length === 0) return;
    if (selectedStores.length === 0 && tempSelectedStores.length === 0) {
      const allCodes = validStores.map((s) => Number(s.StoreCode));
      setSelectedStores(allCodes);
      setTempSelectedStores(allCodes);
    }
  }, [validStores]);

  // -------------------- AUTO FETCH ON LOAD --------------------
  useEffect(() => {
    if (
      validStores.length > 0 &&
      selectedStores.length > 0 &&
      !hasInitialLoaded.current
    ) {
      hasInitialLoaded.current = true;

      // Default params for first load
      const params = {
        storeCodes: selectedStores,
        startDate,
        endDate,
      };
      dispatch(fetchMarginReport(params));
    }
  }, [dispatch, validStores, selectedStores, startDate, endDate]);

  // -------------------- CLICK OUTSIDE --------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        storeDropdownRef.current &&
        !storeDropdownRef.current.contains(event.target as Node)
      )
        setStoreDropdownOpen(false);
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      )
        setFilterDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -------------------- STORE OPTIONS --------------------
  const storeOptions = useMemo(() => {
    return Object.entries(storeMap).filter(([_, name]) =>
      name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    );
  }, [storeMap, searchTerm]);

  const storeButtonLabel = useMemo(() => {
    const total = validStores.length;
    if (tempSelectedStores.length === 0) return "No Stores Selected";
    if (tempSelectedStores.length === total) return `All ${total} Stores`;
    if (tempSelectedStores.length <= 2)
      return tempSelectedStores.map((c) => storeMap[c] || c).join(", ");
    return "Multiple Stores";
  }, [tempSelectedStores, validStores.length, storeMap]);

  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let start: Date;
    let end: Date;

    if (toggleValue === 0) {
      hasAppliedMoMRef.current = false;
      end = yesterday;

      switch (tempDateFilter) {
        case "15days":
          start = new Date(today);
          start.setDate(today.getDate() - 14);
          break;
        case "thisMonth":
        case "monthTillDate":
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case "lastMonth":
          start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          end = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case "last6Months":
          start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
          end = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case "yearTillDate":
          start = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(today.getFullYear(), today.getMonth(), 1);
      }
    } else {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      start = new Date(currentYear, currentMonth - 3, 1);
      end = new Date(currentYear, currentMonth, 0);

      if (hasAppliedMoMRef.current) return;
      hasAppliedMoMRef.current = true;

      const formattedStart = formatLocalDate(start);
      const formattedEnd = formatLocalDate(end);

      setTempDateFilter("last3Months");
      setTempStartDate(formattedStart);
      setTempEndDate(formattedEnd);
      setStartDate(formattedStart);
      setEndDate(formattedEnd);
      return;
    }

    const formattedStart = formatLocalDate(start);
    const formattedEnd = formatLocalDate(end);
    setTempStartDate(formattedStart);
    setTempEndDate(formattedEnd);
    setStartDate(formattedStart);
    setEndDate(formattedEnd);
  }, [toggleValue, tempDateFilter]);

  // helper: compute start/end Date objects and formatted strings for a given filter
  const computeRangeForFilter = (filter: string, toggle: number) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let start: Date;
    let end: Date;

    // Department-wise presets and general logic
    if (toggle === 0) {
      end = yesterday;
      switch (filter) {
        case "15days":
          start = new Date(today);
          start.setDate(today.getDate() - 14);
          break;
        case "thisMonth":
        case "monthTillDate":
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = yesterday;
          break;
        case "lastMonth":
          start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          end = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case "last6Months":
          start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
          end = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case "yearTillDate":
          start = new Date(today.getFullYear(), 0, 1);
          end = yesterday;
          break;
        default:
          // default to month start -> yesterday
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = yesterday;
      }
    } else {
      // MoM mode: support last3Months, monthTillDate, yearTillDate, custom
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      switch (filter) {
        case "monthTillDate":
          start = new Date(currentYear, currentMonth, 1);
          end = yesterday;
          break;
        case "yearTillDate":
          start = new Date(currentYear, 0, 1);
          end = yesterday;
          break;
        case "last3Months":
        default:
          start = new Date(currentYear, currentMonth - 3, 1);
          end = new Date(currentYear, currentMonth, 0);
      }
    }

    // format to your existing util
    const formattedStart = formatLocalDate(start);
    const formattedEnd = formatLocalDate(end);

    return { start, end, formattedStart, formattedEnd };
  };

  // REPLACE your existing applyFilters with this
  const applyFilters = () => {
    const validSet = new Set(validStores.map((s) => Number(s.StoreCode)));
    const cleaned = tempSelectedStores.filter((c) => validSet.has(c));

    // If user chose a preset (non-custom), compute the range now to avoid timing issues
    if (tempDateFilter !== "custom") {
      const { formattedStart, formattedEnd } = computeRangeForFilter(
        tempDateFilter,
        toggleValue,
      );

      // Apply both temp and final values synchronously
      setTempStartDate(formattedStart);
      setTempEndDate(formattedEnd);
      setStartDate(formattedStart);
      setEndDate(formattedEnd);
    } else {
      // custom: ensure final state mirrors temp fields
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
    }

    setSelectedStores(cleaned);
    setDateFilter(tempDateFilter);
    setStoreDropdownOpen(false);
    setFilterDropdownOpen(false);

    // Build params from final applied values (use state vars we just set)
    const params = {
      storeCodes: cleaned,
      startDate:
        tempDateFilter === "custom"
          ? tempStartDate
          : formatLocalDate(new Date(startDate)),
      endDate:
        tempDateFilter === "custom"
          ? tempEndDate
          : formatLocalDate(new Date(endDate)),
    };

    // Safer: compute final strings again directly from computeRangeForFilter to avoid stale state reads
    const finalRange =
      tempDateFilter === "custom"
        ? { start: tempStartDate, end: tempEndDate }
        : computeRangeForFilter(tempDateFilter, toggleValue);

    const finalParams = {
      storeCodes: cleaned,
      startDate:
        "formattedStart" in finalRange
          ? finalRange.formattedStart
          : finalRange.start,
      endDate:
        "formattedEnd" in finalRange ? finalRange.formattedEnd : finalRange.end,
    };

    if (toggleValue === 0) {
      dispatch(fetchMarginReport(finalParams));
    } else {
      dispatch(fetchMoMReport(finalParams));
    }
  };

  // -------------------- PAGINATION --------------------
  const handleNextPage = () => setCurrentPage((p) => p + 1);
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // -------------------- DATE FILTER OPTIONS --------------------
  const dateOptions =
    toggleValue === 0
      ? [
          { value: "15days", label: "Last 15 Days" },
          { value: "thisMonth", label: "This Month" },
          { value: "lastMonth", label: "Last Month" },
          { value: "last6Months", label: "Last 6 Months" },
          { value: "custom", label: "Custom" },
        ]
      : [
          { value: "last3Months", label: "Last 3 Months" },
          { value: "monthTillDate", label: "Month Till Date" },
          { value: "yearTillDate", label: "Year Till Date" },
          { value: "custom", label: "Custom" },
        ];
  // -------------------- RENDER --------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="mx-auto max-w-full">
        <Breadcrumb pageName="Department-wise Margin Report" />

        {/* FILTER CARD */}
        {/* FILTER CARD */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:p-6">
          {/* Filters Row */}
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* STORE SELECT */}
            <div className="relative w-full" ref={storeDropdownRef}>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Store(s)
              </label>
              <button
                onClick={() => {
                  setStoreDropdownOpen((v) => !v);
                  if (!storeDropdownOpen) setSearchTerm("");
                }}
                className="w-full truncate rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-left text-sm font-medium shadow-sm transition hover:border-indigo-400 focus:ring-2 focus:ring-indigo-400"
              >
                {storeButtonLabel}
              </button>

              {storeDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl">
                  <input
                    type="text"
                    placeholder="Search store..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-t-xl border-b border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  <ul className="max-h-56 overflow-y-auto text-sm">
                    {/* Select / Deselect All */}
                    <li
                      key="all"
                      className="cursor-pointer px-3 py-2 font-medium hover:bg-indigo-50"
                      onClick={() => {
                        if (tempSelectedStores.length === validStores.length)
                          setTempSelectedStores([]);
                        else
                          setTempSelectedStores(
                            validStores.map((s) => Number(s.StoreCode)),
                          );
                      }}
                    >
                      {tempSelectedStores.length === validStores.length
                        ? "Deselect All"
                        : "Select All"}
                    </li>

                    {/* Individual Store Options */}
                    {storeOptions.map(([codeStr, name]) => {
                      const code = Number(codeStr);
                      const isSelected = tempSelectedStores.includes(code);
                      return (
                        <li
                          key={code}
                          onClick={() =>
                            setTempSelectedStores((prev) =>
                              prev.includes(code)
                                ? prev.filter((c) => c !== code)
                                : [...prev, code],
                            )
                          }
                          className={`flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-indigo-50 ${
                            isSelected ? "bg-indigo-50" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="accent-indigo-500"
                          />
                          <span className="truncate">{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* DATE RANGE SELECT */}
            <div className="relative w-full" ref={filterDropdownRef}>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Date Range
              </label>
              <select
                value={tempDateFilter}
                onChange={(e) => {
                  setTempDateFilter(e.target.value);
                }}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium shadow-sm transition hover:border-indigo-400 focus:ring-2 focus:ring-indigo-400"
              >
                {dateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Custom Date Inputs */}
              {tempDateFilter === "custom" && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}
            </div>

            {/* TOGGLE + APPLY */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
              <select
                value={toggleValue}
                onChange={(e) => {
                  hasAppliedMoMRef.current = false;
                  setToggleValue(Number(e.target.value));
                }}
                className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-400 focus:ring-2 focus:ring-indigo-400"
              >
                <option value={0}>Department-wise</option>
                <option value={1}>MoM-wise</option>
              </select>

              <button
                onClick={applyFilters}
                className="w-full rounded-xl bg-primary px-6 py-2.5 font-medium text-white shadow-md transition hover:bg-primary focus:ring-2 focus:ring-orange-300 sm:w-auto"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* DASHBOARD CONTENT */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:gap-8">
          {selectedStores.length > 0 ? (
            <MarginReportClient
              storeCode={
                selectedStores.length === validStores.length
                  ? "all"
                  : selectedStores
              }
              startDate={startDate}
              endDate={endDate}
              toggleValue={toggleValue}
              currentPage={currentPage}
              onNextPage={handleNextPage}
              onPreviousPage={handlePreviousPage}
              onDepartmentChange={setSelectedDepartment}
              initialDepartment={selectedDepartment}
            />
          ) : (
            <p className="py-10 text-center text-lg font-medium text-gray-500">
              Please select at least one store.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
