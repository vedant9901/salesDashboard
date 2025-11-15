"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import OverviewCardsGroup from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";

import {
  fetchDashboardSales,
  fetchStoreTargets,
  fetchLMMTDSales,
  fetchOverallSales,
  fetchLYSales,
} from "@/store/dashboardSlice";

import {
  computeNetAmount,
  computeNetMTDBillCuts,
  computeNetMTDQty,
  computeNetMTDRevenue,
} from "@/lib/utils";

import TopChannels from "@/components/Tables/top-channels";

// Charts
const PaymentsOverview = dynamic(
  () => import("@/components/Charts/payments-overview").then(m => m.PaymentsOverview),
  { ssr: false }
);

const WeeksProfit = dynamic(
  () => import("@/components/Charts/weeks-profit").then(m => m.WeeksProfit),
  { ssr: false }
);

// Utility
const formatLocalDate = (d: Date) => {
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const getLastYearRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  return {
    startDateLY: formatLocalDate(new Date(s.getFullYear() - 1, s.getMonth(), s.getDate())),
    endDateLY: formatLocalDate(new Date(e.getFullYear() - 1, e.getMonth(), e.getDate())),
  };
};

export default function Home() {
  const searchParams = useSearchParams();
  const selected_time_frame = searchParams.get("selected_time_frame") ?? "";
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  const safeRecord = (v: any): Record<number, number> =>
    typeof v === "number" ? {} : v || {};

  const paymentsTimeFrame = extractTimeFrame("payments_overview")?.split(":")[1];
  const weeksProfitTimeFrame = extractTimeFrame("weeks_profit")?.split(":")[1];

  const dispatch = useDispatch<AppDispatch>();

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const [startDate, setStartDate] = useState(formatLocalDate(firstDayOfMonth));
  const [endDate, setEndDate] = useState(formatLocalDate(yesterdayDate));

  const [startDateLM, setStartDateLM] = useState("");
  const [endDateLM, setEndDateLM] = useState("");
  const [startDateLY, setStartDateLY] = useState("");
  const [endDateLY, setEndDateLY] = useState("");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

    const [didAutoSelect, setDidAutoSelect] = useState(false);


  // REDUX STATE
  const {
    SalesItems: yesterdaySales = [],
    OverallSalesItems = [],
    StoreTargets = [],
    LMMTDSales = [],
    LYSalesItems = [],
    status: salesStatus,
    error: salesError,
    targetStatus,
    targetError,
  } = useSelector((state: RootState) => state.sales);

  // STORE MAP
  const storeMap: Record<number, string> = {};
  [...OverallSalesItems, ...StoreTargets].forEach((s: any) => {
    const code = Number(s.StoreCode);
    if (!isNaN(code) && code !== 0 && s.StoreName)
      storeMap[code] = s.StoreName.trim();
  });

  const allStoreCodes = Object.keys(storeMap).map(Number);
  const defaultSelectedStores = allStoreCodes.filter(c => c !== 30 && c !== 62);

 useEffect(() => {
  if (!didAutoSelect && defaultSelectedStores.length > 0) {
    setSelectedStores(defaultSelectedStores);
    setDidAutoSelect(true);       // prevent running again
  }
}, [defaultSelectedStores, didAutoSelect]);

 const [selectedStores, setSelectedStores] = useState<number[]>([]);

  const storeOptions = Object.entries(storeMap).filter(([_, name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const storeName =
    selectedStores.length === 0
      ? "Select Stores"
      : selectedStores.length <= 3
        ? selectedStores.map(code => storeMap[code]).join(", ")
        : `${selectedStores.length} Stores Selected`;

  // CLOSE DROPDOWN OUTSIDE CLICK
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // FETCH DATA
  useEffect(() => {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    const lmStart = new Date(sDate.getFullYear(), sDate.getMonth() - 1, sDate.getDate());
    const lmEnd = new Date(eDate.getFullYear(), eDate.getMonth() - 1, eDate.getDate());
    setStartDateLM(formatLocalDate(lmStart));
    setEndDateLM(formatLocalDate(lmEnd));

    const { startDateLY, endDateLY } = getLastYearRange(startDate, endDate);
    setStartDateLY(startDateLY);
    setEndDateLY(endDateLY);

    dispatch(fetchDashboardSales());
    dispatch(fetchStoreTargets());
    dispatch(fetchOverallSales({ startDate, endDate }));
    dispatch(fetchLMMTDSales({ startDate: formatLocalDate(lmStart), endDate: formatLocalDate(lmEnd) }));
    dispatch(fetchLYSales({ startDate: startDateLY, endDate: endDateLY }));
  }, [dispatch, startDate, endDate]);

  // FILTER BY SELECTED
  const filterByStore = (items: any[]) =>
    selectedStores.length === 0
      ? items
      : items.filter(s => selectedStores.includes(Number(s.StoreCode)));

  const selectedYesterday = filterByStore(yesterdaySales);
  const selectedOverall = filterByStore(OverallSalesItems);
  const selectedLMSales = filterByStore(LMMTDSales);
  const selectedLYSales = filterByStore(LYSalesItems);
  const selectedTargets = filterByStore(StoreTargets);

  // TOTALS
  const totalNetAmount = Object.values(computeNetAmount(selectedYesterday) || {}).reduce((a, b) => a + b, 0);

  const yesterdayQtyTotal = Object.values(computeNetMTDQty(selectedYesterday) || {}).reduce((a, b) => a + b, 0);
  const yesterdayBills = Object.values(computeNetMTDBillCuts(selectedYesterday) || {}).reduce((a, b) => a + b, 0);
  const yesterdayIPT = yesterdayBills ? yesterdayQtyTotal / yesterdayBills : 0;

  const totalSalesVal = Object.values(computeNetMTDRevenue(selectedOverall) || {}).reduce((a, b) => a + b, 0);
  const mtdQtyTotal = Object.values(computeNetMTDQty(selectedOverall) || {}).reduce((a, b) => a + b, 0);
  const mtdBills = Object.values(computeNetMTDBillCuts(selectedOverall) || {}).reduce((a, b) => a + b, 0);
  const mtdIPT = mtdBills ? mtdQtyTotal / mtdBills : 0;

  const lmTotal = Object.values(computeNetMTDRevenue(selectedLMSales) || {}).reduce((a, b) => a + b, 0);
  const lmQtyTotal = Object.values(computeNetMTDQty(selectedLMSales) || {}).reduce((a, b) => a + b, 0);
  const lmBills = Object.values(computeNetMTDBillCuts(selectedLMSales) || {}).reduce((a, b) => a + b, 0);
  const lmIpt = lmBills ? lmQtyTotal / lmBills : 0;

  const totalLy = Object.values(computeNetMTDRevenue(selectedLYSales) || {}).reduce((a, b) => a + b, 0);
  const lyQtyTotal = Object.values(computeNetMTDQty(selectedLYSales) || {}).reduce((a, b) => a + b, 0);
  const lyBills = Object.values(computeNetMTDBillCuts(selectedLYSales) || {}).reduce((a, b) => a + b, 0);
  const lyIpt = lyBills ? lyQtyTotal / lyBills : 0;

  const totalTargetVal = selectedTargets.reduce((sum, t) => sum + (Number(t.Target) || 0), 0);
  const percentAchieved = totalTargetVal ? (totalSalesVal / totalTargetVal) * 100 : 0;
  const mtdGrowth = lmTotal > 0 ? ((totalSalesVal - lmTotal) / lmTotal) * 100 : 0;

  if (salesStatus === "loading" || targetStatus === "loading") return <p className="p-4">Loading…</p>;
  if (salesStatus === "failed") return <p className="text-red-500">{salesError}</p>;
  if (targetStatus === "failed") return <p className="text-red-500">{targetError}</p>;

  return (
    <div className="p-4">

      {/* FILTERS */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-4">
        <div className="relative mb-2 w-full md:mb-0 md:w-64" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm hover:shadow-md"
          >
            {storeName}
          </button>

          {dropdownOpen && (
            <div className="absolute z-[9999] mt-1 max-h-80 w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b bg-gray-50 px-3 py-2">
                <span className="text-sm font-medium">Stores</span>

                <button
                  onClick={() => {
                    setSelectedStores(
                      selectedStores.length === defaultSelectedStores.length
                        ? []
                        : defaultSelectedStores
                    );
                    setSearchTerm("");
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {selectedStores.length === defaultSelectedStores.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <input
                type="text"
                placeholder="Search store…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedStores([]);   // 🔥 CLEAR SELECTED STORES WHEN SEARCHING
                }}
                className="w-full border-b px-3 py-2 text-sm"
              />

              <ul className="max-h-64 overflow-y-auto">
                {storeOptions.map(([code, name]) => (
                  <li
                    key={code}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100"
                    onClick={() => {
                      const c = Number(code);
                      setSelectedStores(prev =>
                        prev.includes(c)
                          ? prev.filter(v => v !== c)
                          : [...prev, c]
                      );
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStores.includes(Number(code))}
                      readOnly
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="text-sm">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm"
          />
        </div>
      </div>

      {/* CARDS */}
      <Suspense fallback={<OverviewCardsSkeleton />}>
         <OverviewCardsGroup
            selectedStore={selectedStores}
            storeName={storeName}

            totalNetAmountClient={selectedStores.length === 0 ? 0 : totalNetAmount}
            totalSalesClient={selectedStores.length === 0 ? 0 : totalSalesVal}
            totalTargetClient={selectedStores.length === 0 ? 0 : totalTargetVal}
            percentAchievedClient={selectedStores.length === 0 ? 0 : percentAchieved}

            lmMtdClient={selectedStores.length === 0 ? 0 : lmTotal}
            lyClient={selectedStores.length === 0 ? 0 : totalLy}
            mtdGrowthClient={selectedStores.length === 0 ? 0 : mtdGrowth}

            yesterdayIPT={selectedStores.length === 0 ? 0 : yesterdayIPT}
            mtdIPT={selectedStores.length === 0 ? 0 : mtdIPT}
            lmIPT={selectedStores.length === 0 ? 0 : lmIpt}
            lyIPT={selectedStores.length === 0 ? 0 : lyIpt}

            yesterdayTotalBills={selectedStores.length === 0 ? 0 : yesterdayBills}
            mtdTotalBills={selectedStores.length === 0 ? 0 : mtdBills}
            lmTotalBills={selectedStores.length === 0 ? 0 : lmBills}
            lyTotalBills={selectedStores.length === 0 ? 0 : lyBills}

            mtdSaleQty={selectedStores.length === 0 ? {} : computeNetMTDQty(selectedOverall)}
          />
      </Suspense>

      {/* TABLE */}
      <div className="mt-4 grid grid-cols-1 gap-4">
        <TopChannels
          stores={storeMap}  
          data={selectedOverall}
          StoreTargets={selectedTargets}

          totalSales={safeRecord(computeNetMTDRevenue(selectedOverall))}

          LYSalesItems={safeRecord(computeNetMTDRevenue(selectedLYSales))}
          LMSalesItems={safeRecord(computeNetMTDRevenue(selectedLMSales))}

          mtdSaleQty={safeRecord(computeNetMTDQty(selectedOverall))}
          LYmtdSaleQty={safeRecord(computeNetMTDQty(selectedLYSales))}

          LYBillCuts={safeRecord(computeNetMTDBillCuts(selectedLYSales))}
          MTDBillCuts={safeRecord(computeNetMTDBillCuts(selectedOverall))}
        />
      </div>

      {/* CHARTS */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        {paymentsTimeFrame && (
          <PaymentsOverview
            className="col-span-12 xl:col-span-7"
            key={paymentsTimeFrame}
            timeFrame={paymentsTimeFrame}
          />
        )}
        {weeksProfitTimeFrame && (
          <WeeksProfit
            className="col-span-12 xl:col-span-5"
            key={weeksProfitTimeFrame}
            timeFrame={weeksProfitTimeFrame}
          />
        )}
      </div>
    </div>
  );
}
