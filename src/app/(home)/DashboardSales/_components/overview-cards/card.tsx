"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import type { JSX } from "react";
import { IconType } from "react-icons"; // ✅ Import react-icon type

type PropsType = {
  label: string;
  data: {
    value: number | string | JSX.Element;
    growthRate: number;
  };
  Icon?: IconType; // ✅ Accept react-icons now
};

export function OverviewCard({ label, data, Icon }: PropsType) {
  const isDecreasing = data.growthRate < 0;

  return (
    <div className="relative rounded-lg bg-white p-3 shadow-1 dark:bg-gray-dark">
      {/* Icon + Label */}
      <div className="flex items-center justify-between text-sm font-medium text-blue-400">
        <span className="flex items-center gap-1">
          {Icon && <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="mt-1">
        <span className="text-lg font-bold text-dark dark:text-white">
          {data.value}
        </span>
      </div>

      {/* Growth */}
      <div
        className={cn(
          "mt-1 flex items-center gap-1 text-xs font-medium",
          isDecreasing ? "text-red" : "text-green"
        )}
      >
        {(Number(data.growthRate) || 0).toFixed(0)}%

        {isDecreasing ? (
          <ArrowDownIcon className="h-3 w-3" />
        ) : (
          <ArrowUpIcon className="h-3 w-3" />
        )}
      </div>
    </div>
  );
}
