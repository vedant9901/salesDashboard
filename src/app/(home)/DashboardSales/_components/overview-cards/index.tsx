"use client";

import { OverviewCard } from "./card";
import { indianCompactFormat } from "@/lib/format-number";
import {
  MdAttachMoney,
  MdTrendingUp,
  MdCalendarToday,
  MdPeople,
  MdMoneyOff,
} from "react-icons/md";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";

interface OverviewCardsProps {
  selectedStore: number[] | "all";
  storeName: string;
  totalNetAmountClient: number;
  totalSalesClient: number;
  totalTargetClient: number;
  percentAchievedClient: number;
  lmMtdClient: number;
  lyClient: number;
  mtdGrowthClient: number;
  yesterdayIPT: number;
  yesterdayTotalBills: number;
  mtdIPT: number;
  mtdTotalBills: number;
  lyIPT: number;
  lyTotalBills: number;
  lmIPT: number;
  lmTotalBills: number;
  mtdSaleQty: any;
}

export default function OverviewCardsGroup({
  selectedStore,
  storeName,
  totalNetAmountClient,
  totalSalesClient,
  totalTargetClient,
  percentAchievedClient,
  lmMtdClient,
  lyClient,
  mtdGrowthClient,
  yesterdayIPT,
  yesterdayTotalBills,
  mtdIPT,
  mtdTotalBills,
  lyIPT,
  lyTotalBills,
  lmIPT,
  lmTotalBills,
  mtdSaleQty,
}: OverviewCardsProps) {
  const computeGrowth = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : 0;

  const billCutGOLY =
    lyTotalBills > 0
      ? ((mtdTotalBills - lyTotalBills) / lyTotalBills) * 100
      : 0;

  const totalMTDQty = (Object.values(mtdSaleQty || []) as number[]).reduce(
    (sum, qty) => sum + (Number(qty) || 0),
    0
  );

  const ASP = totalMTDQty > 0 ? totalSalesClient / totalMTDQty : 0;

  return (
    <div className="grid gap-5 sm:grid-cols-3 sm:gap-6 xl:grid-cols-6 2xl:gap-7.5">
      <OverviewCard
        label="Yesterday Sales"
        data={{
          value: <span suppressHydrationWarning>₹{indianCompactFormat(totalNetAmountClient)}</span>,
          growthRate: 0,
        }}
        Icon={RiMoneyRupeeCircleFill}
      />

      <OverviewCard
        label="ACH VS TGT"
        data={{
          value: (
            <span suppressHydrationWarning>
              ₹{indianCompactFormat(totalSalesClient)} / ₹
              {indianCompactFormat(totalTargetClient)}
            </span>
          ),
          growthRate: Number(percentAchievedClient || 0),
        }}
        Icon={MdTrendingUp}
      />

      <OverviewCard
        label="Current vs Last Month"
        data={{
          value: (
            <span suppressHydrationWarning>
              ₹{indianCompactFormat(totalSalesClient)} / ₹
              {indianCompactFormat(lmMtdClient)}
            </span>
          ),
          growthRate: Number(mtdGrowthClient || 0),
        }}
        Icon={MdCalendarToday}
      />

      <OverviewCard
        label="Current Year vs Last Year"
        data={{
          value: (
            <span suppressHydrationWarning>
              ₹{indianCompactFormat(totalSalesClient)} / ₹
              {indianCompactFormat(lyClient)}
            </span>
          ),
          growthRate: computeGrowth(totalSalesClient, lyClient),
        }}
        Icon={MdPeople}
      />

      <OverviewCard
        label="Current vs Last Month IPT & Bill Cuts"
        data={{
          value: (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                Bill Cuts: {indianCompactFormat(mtdTotalBills)} / {indianCompactFormat(lmTotalBills)}
              </span>
              <span className="text-sm text-muted-foreground">
                IPT: {mtdIPT?.toFixed(2)} / {lmIPT?.toFixed(2)}
              </span>
            </div>
          ),
          growthRate: computeGrowth(mtdIPT, lmIPT),
        }}
        Icon={MdMoneyOff}
      />

      <OverviewCard
        label="Current vs Last Year IPT & Bill Cuts"
        data={{
          value: (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                Bill Cuts: {indianCompactFormat(mtdTotalBills)} / {indianCompactFormat(lyTotalBills)}
              </span>
              <span className="text-sm text-muted-foreground">
                IPT: {mtdIPT?.toFixed(2)} / {lyIPT?.toFixed(2)}
              </span>
            </div>
          ),
          growthRate: computeGrowth(mtdIPT, lyIPT),
        }}
        Icon={MdMoneyOff}
      />

      <OverviewCard
        label="Bill Cut GOLY%"
        data={{
          value: <span suppressHydrationWarning>{billCutGOLY.toFixed(2)}%</span>,
          growthRate: billCutGOLY,
        }}
        Icon={MdTrendingUp}
      />

      <OverviewCard
        label="ASP (Avg Selling Price)"
        data={{
          value: <span suppressHydrationWarning>₹{ASP.toFixed(2)}</span>,
          growthRate: 0,
        }}
        Icon={RiMoneyRupeeCircleFill}
      />
    </div>
  );
}
