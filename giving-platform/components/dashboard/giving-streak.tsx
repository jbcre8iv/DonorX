"use client";

import { Flame, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <CardContent>
        <div className="space-y-4">
          {/* Current Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${currentStreak > 0 ? "text-orange-500" : "text-slate-300"}`}>
                {currentStreak}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">
                  {currentStreak === 1 ? "Month" : "Months"}
                </div>
                <div className="text-xs text-slate-500">Current streak</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Best: {longestStreak} months</div>
              {lastDonationDate && (
                <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
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
                  className={`h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                    month.active
                      ? "bg-orange-100 text-orange-600 ring-2 ring-orange-200"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {month.active && <Flame className="h-3 w-3" />}
                </div>
                <div className="text-xs text-slate-500 mt-1">{month.label}</div>
              </div>
            ))}
          </div>

          {/* Encouragement */}
          {currentStreak === 0 && (
            <p className="text-xs text-center text-slate-500">
              Make a donation this month to start your streak!
            </p>
          )}
          {currentStreak > 0 && currentStreak < longestStreak && (
            <p className="text-xs text-center text-slate-500">
              {longestStreak - currentStreak} more month{longestStreak - currentStreak !== 1 ? "s" : ""} to beat your record!
            </p>
          )}
          {currentStreak > 0 && currentStreak >= longestStreak && longestStreak > 1 && (
            <p className="text-xs text-center text-orange-600 font-medium">
              🔥 You&apos;re on your longest streak!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
