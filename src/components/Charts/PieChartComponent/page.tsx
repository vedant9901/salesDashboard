import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface PieChartProps {
  data: { name: string; value: number }[];
  onSliceHover?: (name: string | null) => void;
  highlightRow?: boolean;
  showTooltip?: boolean;
}

const COLORS = ["#4F46E5", "#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE", "#E0E7FF"];

export const PieChartComponent: React.FC<PieChartProps> = ({ data, onSliceHover, highlightRow, showTooltip }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        {showTooltip && (
          <Tooltip
            formatter={(value: number, name: string) => {
              const percent = ((value / total) * 100).toFixed(2);
              return [`₹ ${value.toLocaleString("en-IN")} (${percent}%)`, name];
            }}
          />
        )}
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
          fill="#4F46E5"
          onMouseEnter={(e: any) => onSliceHover?.(highlightRow ? e?.name : null)}
          onMouseLeave={() => onSliceHover?.(null)}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
