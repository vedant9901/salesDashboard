'use client';

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TopChannels from "@/components/Tables/top-channels";
import { fetchStores } from "@/store/storesSlice";
import type { AppDispatch, RootState } from "@/store";
import { uniqueBy, computeNetAmount } from "@/lib/utils";

// Excluded store codes
const excludeStoreCodes = [1,2,3,4,18,19,20,21,22,23,26,29,32,33,47,60,66,37,42,43,59];

export default function TopChannelsContainer() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: stores, status, error } = useSelector((state: RootState) => state.stores);
  const { OverallSalesItems, SalesItems: yesterdaySales } = useSelector((state: RootState) => state.sales);

  const [topChannelsData, setTopChannelsData] = useState<{
    data: any[];
    scMap: Record<number, number>;
    lsrMap: Record<number, number>;
    netRevenueMap: Record<number, number>;
  } | null>(null);

  // Fetch stores
  useEffect(() => {
    if (status === "idle") dispatch(fetchStores());
  }, [status, dispatch]);

  // Process data once stores and sales are available
  useEffect(() => {
    if (!stores.length || !OverallSalesItems) return;

    const filteredStores = stores.filter(
      (s) => !excludeStoreCodes.includes(s.StoreCode)
    );

    const data = uniqueBy(filteredStores, "StoreCode");

    // Prepare SC, LSR maps
    const scMap: Record<number, number> = {};
    const lsrMap: Record<number, number> = {};

    yesterdaySales.forEach(({ StoreCode, BillSeries, Amount }) => {
      const amt = Number(Amount) || 0;
      const series = BillSeries?.trim().toUpperCase();

      if (series === "SC" || series === "B2B" || series === "WB") {
        scMap[StoreCode] = (scMap[StoreCode] || 0) + amt;
      }

      if (series === "LSR") {
        lsrMap[StoreCode] = (lsrMap[StoreCode] || 0) + amt;
      }
    });

    // Net revenue = SC + B2B + WB − LSR
    const netRevenueMap: Record<number, number> = {};
    Object.keys(scMap).forEach((storeCode) => {
      const code = Number(storeCode);
      netRevenueMap[code] = (scMap[code] || 0) ;
    });

    setTopChannelsData({ data, scMap, lsrMap, netRevenueMap });
  }, [stores, yesterdaySales]);

  if (status === "loading") return <p className="p-4">Loading stores…</p>;
  if (status === "failed") return <p className="p-4 text-red-500">{error}</p>;
  if (!topChannelsData) return <p className="p-4">Loading data…</p>;

  return (
    <TopChannels
      data={topChannelsData.data}
      scMap={topChannelsData.scMap}
      lsrMap={topChannelsData.lsrMap}
      netRevenueMap={topChannelsData.netRevenueMap}
    />
  );
}
