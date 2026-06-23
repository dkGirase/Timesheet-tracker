"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "Jan", sales: 120, revenue: 300 },
  { month: "Feb", sales: 180, revenue: 350 },
  { month: "Mar", sales: 150, revenue: 420 },
  { month: "Apr", sales: 200, revenue: 390 },
  { month: "May", sales: 240, revenue: 460 },
  { month: "Jun", sales: 300, revenue: 500 },
];

const chartConfig = {
  sales: {
    label: "Sales",
    color: "#3b82f6", // blue-500
  },
  revenue: {
    label: "Revenue",
    color: "#ef4444", // red-500
  },
};

export default function MultiLineChart() {
  return (
    <Card>
      <CardContent>
        <h2 className="text-2xl font-semibold mb-5">Working Hours</h2>
        <ChartContainer config={chartConfig} className="min-h-[300px] p-2">
          <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />

            {/* Tooltip — ShadCN version */}
            <RechartsTooltip content={<ChartTooltipContent />} />

            {/* Legend — ShadCN version */}
            <RechartsLegend content={<ChartLegendContent />} />

            {/* --- Lines --- */}
            <Line
              type="monotone"
              dataKey="sales"
              stroke="var(--color-sales)"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
