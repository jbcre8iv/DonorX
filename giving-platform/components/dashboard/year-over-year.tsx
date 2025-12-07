"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface YearOverYearProps {
  currentYear: number;
  currentYearAmount: number;
  previousYearAmount: number;
  currentYearDonations: number;
  previousYearDonations: number;
}

export function YearOverYear({
  currentYear,
  currentYearAmount,
  previousYearAmount,
  currentYearDonations,
  previousYearDonations,
}: YearOverYearProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 100 / 1000000).toFixed(1)}M`;
    if (value >= 100000) return `$${(value / 100 / 1000).toFixed(0)}K`;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  const amountChange = previousYearAmount > 0
    ? ((currentYearAmount - previousYearAmount) / previousYearAmount) * 100
    : currentYearAmount > 0 ? 100 : 0;

  const donationsChange = previousYearDonations > 0
    ? ((currentYearDonations - previousYearDonations) / previousYearDonations) * 100
    : currentYearDonations > 0 ? 100 : 0;

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-emerald-600";
    if (change < 0) return "text-red-600";
    return "text-slate-500";
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(0)}%`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Year-over-Year</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Amount Comparison */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Total Amount</span>
              <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(amountChange)}`}>
                {getChangeIcon(amountChange)}
                {formatChange(amountChange)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">{currentYear}</div>
                <div className="text-lg font-bold text-slate-900">
                  {formatCurrency(currentYearAmount)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">{currentYear - 1}</div>
                <div className="text-lg font-bold text-slate-400">
                  {formatCurrency(previousYearAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Donation Count Comparison */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Donations Made</span>
              <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(donationsChange)}`}>
                {getChangeIcon(donationsChange)}
                {formatChange(donationsChange)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">{currentYear}</div>
                <div className="text-lg font-bold text-slate-900">
                  {currentYearDonations}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">{currentYear - 1}</div>
                <div className="text-lg font-bold text-slate-400">
                  {previousYearDonations}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
