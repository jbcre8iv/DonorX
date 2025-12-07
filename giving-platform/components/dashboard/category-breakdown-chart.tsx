"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryBreakdownChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Add colors to data
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Giving by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-slate-500">
            No category data yet
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-[160px] w-[160px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataWithColors}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dataWithColors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 overflow-hidden">
              {dataWithColors.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 truncate">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-900 ml-2">
                    {((item.value / total) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              {dataWithColors.length > 5 && (
                <div className="text-xs text-slate-500">
                  +{dataWithColors.length - 5} more categories
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
