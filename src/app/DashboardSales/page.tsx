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

// --- Dynamic imports for charts
const PaymentsOverview = dynamic(
  () =>
    import("@/components/Charts/payments-overview").then(
      (m) => m.PaymentsOverview,
    ),
  { ssr: false },
);

const WeeksProfit = dynamic(
  () => import("@/components/Charts/weeks-profit").then((m) => m.WeeksProfit),
  { ssr: false },
);

// --- Utility functions
const formatLocalDate = (d: Date) => {
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const getLastYearRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  return {
    startDateLY: formatLocalDate(
      new Date(s.getFullYear() - 1, s.getMonth(), s.getDate()),
    ),
    endDateLY: formatLocalDate(
      new Date(e.getFullYear() - 1, e.getMonth(), e.getDate()),
    ),
  };
};

export default function Home() {
  const searchParams = useSearchParams();
  const selected_time_frame = searchParams.get("selected_time_frame") ?? "";
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  const paymentsTimeFrame =
    extractTimeFrame("payments_overview")?.split(":")[1];
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

  // --- Redux state
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

  // --- Build store map only with numeric StoreCodes
  const storeMap: Record<number, string> = {};
  [...OverallSalesItems, ...StoreTargets].forEach((s: any) => {
    const code = Number(s.StoreCode);
    if (!isNaN(code) && s.StoreName && s.StoreCode !== "" && s.StoreCode !== "Store Code") {
      storeMap[code] = s.StoreName;
    }
  });

  // --- Default selected stores: all except 30 and 62
  const allStoreCodes = Object.keys(storeMap).map(Number);
  const defaultSelectedStores = allStoreCodes.filter(
    (code) => code !== 30 && code !== 62,
  );
  const [selectedStores, setSelectedStores] = useState<number[]>(
    defaultSelectedStores,
  );

  const storeOptions = Object.entries(storeMap).filter(([_, name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const storeName =
    selectedStores.length === 0
      ? "Select Stores"
      : selectedStores.length <= 3
        ? selectedStores.map((code) => storeMap[code]).join(", ")
        : `${selectedStores.length} Stores Selected`;

  // --- Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Fetch data
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

  // --- Filter by selected stores only
  const filterByStore = (items: any[]) =>
    selectedStores.length === 0
      ? items
      : items.filter((s) => selectedStores.includes(Number(s.StoreCode)));

  const selectedYesterday = filterByStore(yesterdaySales);
  const selectedOverall = filterByStore(OverallSalesItems);
  const selectedLMSales = filterByStore(LMMTDSales);
  const selectedLYSales = filterByStore(LYSalesItems);
  const selectedTargets = filterByStore(StoreTargets);

  // --- Totals (only valid numeric data)
  const totalNetAmount = Object.values(computeNetAmount(selectedYesterday) || {}).reduce((sum, v) => sum + v, 0);
  const yesterdayQtyTotal = Object.values(computeNetMTDQty(selectedYesterday) || {}).reduce((sum, v) => sum + v, 0);
  const yesterdayBills = Object.values(computeNetMTDBillCuts(selectedYesterday) || {}).reduce((sum, v) => sum + v, 0);
  const yesterdayIPT = yesterdayBills ? yesterdayQtyTotal / yesterdayBills : 0;

  const totalSalesVal = Object.values(computeNetMTDRevenue(selectedOverall) || {}).reduce((sum, v) => sum + v, 0);
  const mtdQtyTotal = Object.values(computeNetMTDQty(selectedOverall) || {}).reduce((sum, v) => sum + v, 0);
  const mtdBills = Object.values(computeNetMTDBillCuts(selectedOverall) || {}).reduce((sum, v) => sum + v, 0);
  const mtdIPT = mtdBills ? mtdQtyTotal / mtdBills : 0;

  const lmTotal = Object.values(computeNetMTDRevenue(selectedLMSales) || {}).reduce((sum, v) => sum + v, 0);
  const lmQtyTotal = Object.values(computeNetMTDQty(selectedLMSales) || {}).reduce((sum, v) => sum + v, 0);
  const lmBills = Object.values(computeNetMTDBillCuts(selectedLMSales) || {}).reduce((sum, v) => sum + v, 0);
  const lmIpt = lmBills ? lmQtyTotal / lmBills : 0;

  const totalLy = Object.values(computeNetMTDRevenue(selectedLYSales) || {}).reduce((sum, v) => sum + v, 0);
  const lyQtyTotal = Object.values(computeNetMTDQty(selectedLYSales) || {}).reduce((sum, v) => sum + v, 0);
  const lyBills = Object.values(computeNetMTDBillCuts(selectedLYSales) || {}).reduce((sum, v) => sum + v, 0);
  const lyIpt = lyBills ? lyQtyTotal / lyBills : 0;

  const totalTargetVal = selectedTargets.reduce(
    (sum, t) => sum + (Number(t.Target) || 0),
    0,
  );
  const percentAchieved = totalTargetVal ? (totalSalesVal / totalTargetVal) * 100 : 0;
  const mtdGrowth = lmTotal > 0 ? ((totalSalesVal - lmTotal) / lmTotal) * 100 : 0;

  if (salesStatus === "loading" || targetStatus === "loading") return <p className="p-4">Loading…</p>;
  if (salesStatus === "failed") return <p className="text-red-500">{salesError}</p>;
  if (targetStatus === "failed") return <p className="text-red-500">{targetError}</p>;

  return (
    <div className="p-4">
      {/* Store Dropdown + Date Picker */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-4">
        <div className="relative mb-2 w-full md:mb-0 md:w-64" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition-all hover:shadow-md focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {storeName}
          </button>

          {dropdownOpen && (
            <div className="absolute z-[9999] mt-1 max-h-80 w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-300 bg-gray-50 px-3 py-2">
                <span className="text-sm font-medium">Stores</span>
                <button
                  onClick={() => {
                    setSelectedStores(
                      selectedStores.length === defaultSelectedStores.length
                        ? []
                        : defaultSelectedStores,
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-b border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <ul className="max-h-64 overflow-y-auto">
                {storeOptions.map(([code, name]) => (
                  <li
                    key={code}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100"
                    onClick={() => {
                      const c = Number(code);
                      setSelectedStores((prev) =>
                        prev.includes(c)
                          ? prev.filter((v) => v !== c)
                          : [...prev, c],
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
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup
          selectedStore={selectedStores}
          storeName={storeName}
          totalNetAmountClient={totalNetAmount}
          totalSalesClient={totalSalesVal}
          totalTargetClient={totalTargetVal}
          percentAchievedClient={percentAchieved}
          lmMtdClient={lmTotal}
          lyClient={totalLy}
          mtdGrowthClient={mtdGrowth}
          yesterdayIPT={yesterdayIPT}
          mtdIPT={mtdIPT}
          lmIPT={lmIpt}
          lyIPT={lyIpt}
          yesterdayTotalBills={yesterdayBills}
          mtdTotalBills={mtdBills}
          lmTotalBills={lmBills}
          lyTotalBills={lyBills}
          mtdSaleQty={computeNetMTDQty(selectedOverall)}
        />
      </Suspense>

      <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        <TopChannels
          stores={storeOptions}
          data={selectedOverall}
          targets={selectedTargets}
          lmSales={selectedLMSales}
          lySales={selectedLYSales}
          totalSales={computeNetMTDRevenue(selectedOverall)}
          StoreTargets={selectedTargets}
          LYSalesItems={computeNetMTDRevenue(selectedLYSales)}
          LMSalesItems={computeNetMTDRevenue(selectedLMSales)}
          mtdSaleQty={computeNetMTDQty(selectedOverall)}
          LYmtdSaleQty={computeNetMTDQty(selectedLYSales)}
          LYBillCuts={computeNetMTDBillCuts(selectedLYSales)}
          MTDBillCuts={computeNetMTDBillCuts(selectedOverall)}
        />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
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
