"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

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

const MAX_VISIBLE = 5;

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalForFiltering = data.reduce((sum, item) => sum + item.value, 0);

  // Filter out categories that round to 0%
  const filteredData = data.filter((item) => {
    if (item.value <= 0) return false;
    const percentage = (item.value / totalForFiltering) * 100;
    return Math.round(percentage) > 0;
  });

  // Recalculate total from filtered data for display percentages
  const total = filteredData.reduce((sum, item) => sum + item.value, 0);

  // Add colors to data
  const dataWithColors = filteredData.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  const visibleCategories = isExpanded ? dataWithColors : dataWithColors.slice(0, MAX_VISIBLE);
  const hasMore = dataWithColors.length > MAX_VISIBLE;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Giving by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[140px] text-slate-500">
            No category data yet
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-[130px] w-[130px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataWithColors}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
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
            <div className="flex-1 space-y-1.5 overflow-hidden">
              {visibleCategories.map((item) => (
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
              {hasMore && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      +{dataWithColors.length - MAX_VISIBLE} more {dataWithColors.length - MAX_VISIBLE === 1 ? "category" : "categories"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
