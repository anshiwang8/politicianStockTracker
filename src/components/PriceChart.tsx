"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PriceChart({ prices }: { prices: Array<{ date: string; close: string | number }> }) {
  const data = prices.map((price) => ({
    date: new Date(price.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    close: Number(price.close)
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Close"]} />
          <Line type="monotone" dataKey="close" stroke="#0f766e" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
