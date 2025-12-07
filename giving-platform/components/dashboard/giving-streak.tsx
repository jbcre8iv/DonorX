"use client";

import { Flame, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface GivingStreakProps {
  currentStreak: number;
  longestStreak: number;
  lastDonationDate: string | null;
  streakMonths: string[]; // Array of month names in streak
}

export function GivingStreak({
  currentStreak,
  longestStreak,
  lastDonationDate,
  streakMonths,
}: GivingStreakProps) {
  // Generate last 6 months for display
  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString("en-US", { month: "short" }),
        key: d.toISOString().slice(0, 7), // YYYY-MM format
        active: streakMonths.includes(d.toISOString().slice(0, 7)),
      });
    }
    return months;
  };

  const monthsDisplay = getLast6Months();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Giving Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Current Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${currentStreak > 0 ? "text-orange-500" : "text-slate-300"}`}>
                <AnimatedNumber value={currentStreak} format="number" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">
                  {currentStreak === 1 ? "Month" : "Months"}
                </div>
                <div className="text-xs text-slate-500">Current streak</div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-500">Best: {longestStreak} {longestStreak === 1 ? "month" : "months"}</div>
              {lastDonationDate && (
                <div className="text-slate-400 flex items-center justify-end gap-1">
                  <Calendar className="h-3 w-3" />
                  Last: {new Date(lastDonationDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              )}
            </div>
          </div>

          {/* Month Indicators */}
          <div className="flex justify-between gap-1">
            {monthsDisplay.map((month) => (
              <div key={month.key} className="flex-1 text-center">
                <div
                  className={`h-6 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                    month.active
                      ? "bg-orange-100 text-orange-600 ring-1 ring-orange-200"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {month.active && <Flame className="h-3 w-3" />}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{month.label}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
