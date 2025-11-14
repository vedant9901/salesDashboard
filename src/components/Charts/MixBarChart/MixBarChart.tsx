"use client";

import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

interface MixBarChartProps {
  data: any[];
  height?: number;
}

export default function MixBarChart({ data, height = 300 }: MixBarChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
      <h3 className="mb-2 text-center text-sm font-semibold text-gray-600">
        Department Sales – Current vs Last Month vs Last Year
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
          <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
          <Legend />
          <Bar dataKey="Current" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="LastMonth" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="LastYear" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="Margin" stroke="#EF4444" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
