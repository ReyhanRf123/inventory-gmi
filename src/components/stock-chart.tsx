"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export interface StockChartDataPoint {
  date: string;
  inQty: number;
  outQty: number;
}

interface StockChartProps {
  data: StockChartDataPoint[];
}

export function StockChart({ data }: StockChartProps) {
  // If all data points have 0 quantity
  const totalVolume = data.reduce((sum, d) => sum + d.inQty + d.outQty, 0);

  if (totalVolume === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>Belum ada aktivitas mutasi stok dalam 30 hari terakhir.</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderColor: "#e2e8f0",
              borderRadius: "0.5rem",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: any, name: any) => [
              `${value} Unit`,
              name === "inQty" ? "Barang Masuk" : "Barang Keluar",
            ]}
            labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
            formatter={(value) => (value === "inQty" ? "Barang Masuk" : "Barang Keluar")}
          />
          <Bar
            dataKey="inQty"
            name="inQty"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="outQty"
            name="outQty"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
