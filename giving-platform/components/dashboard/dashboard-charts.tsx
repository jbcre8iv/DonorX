"use client";

import { useState } from "react";
import { DonationTrendsChart } from "./donation-trends-chart";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { TopNonprofitsChart } from "./top-nonprofits-chart";
import { GivingGoalWidget } from "./giving-goal-widget";
import { GivingStreak } from "./giving-streak";
import { YearOverYear } from "./year-over-year";
import { ImpactCounter } from "./impact-counter";
import { RecentDonationsCompact } from "./recent-donations-compact";
import { MilestoneCelebration } from "./milestone-celebration";

interface DashboardChartsProps {
  trendData: { month: string; amount: number; count: number }[];
  categoryData: { name: string; value: number; color: string }[];
  topNonprofits: { name: string; amount: number }[];
  givingGoal: { currentAmount: number; goalAmount: number };
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastDonationDate: string | null;
    streakMonths: string[];
  };
  yearOverYear: {
    currentYear: number;
    currentYearAmount: number;
    previousYearAmount: number;
    currentYearDonations: number;
    previousYearDonations: number;
  };
  impactData: {
    totalDonated: number;
    nonprofitsSupported: number;
    totalDonations: number;
    yearsGiving: number;
  };
  recentDonations: {
    id: string;
    amount_cents: number;
    status: string;
    created_at: string;
    recipients: string[];
  }[];
  milestone?: {
    type: "amount" | "count" | "streak" | "first";
    value: number;
    label: string;
  } | null;
  onGoalChange?: (newGoal: number) => void;
}

export function DashboardCharts({
  trendData,
  categoryData,
  topNonprofits,
  givingGoal,
  streakData,
  yearOverYear,
  impactData,
  recentDonations,
  milestone,
  onGoalChange,
}: DashboardChartsProps) {
  const [showMilestone, setShowMilestone] = useState(!!milestone);

  return (
    <>
      {/* Milestone Celebration Modal */}
      {showMilestone && milestone && (
        <MilestoneCelebration
          milestone={milestone}
          onDismiss={() => setShowMilestone(false)}
        />
      )}

      {/* Row 1: Trends Chart and Category Breakdown */}
      <div className="grid gap-3 lg:grid-cols-2">
        <DonationTrendsChart data={trendData} />
        <CategoryBreakdownChart data={categoryData} />
      </div>

      {/* Row 2: Goal, Streak, Year-over-Year */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <GivingGoalWidget
          currentAmount={givingGoal.currentAmount}
          goalAmount={givingGoal.goalAmount}
          year={yearOverYear.currentYear}
          onGoalChange={onGoalChange}
        />
        <GivingStreak
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
          lastDonationDate={streakData.lastDonationDate}
          streakMonths={streakData.streakMonths}
        />
        <YearOverYear
          currentYear={yearOverYear.currentYear}
          currentYearAmount={yearOverYear.currentYearAmount}
          previousYearAmount={yearOverYear.previousYearAmount}
          currentYearDonations={yearOverYear.currentYearDonations}
          previousYearDonations={yearOverYear.previousYearDonations}
        />
      </div>

      {/* Row 3: Top Nonprofits and Impact Counter */}
      <div className="grid gap-3 lg:grid-cols-2">
        <TopNonprofitsChart data={topNonprofits} />
        <ImpactCounter
          totalDonated={impactData.totalDonated}
          nonprofitsSupported={impactData.nonprofitsSupported}
          totalDonations={impactData.totalDonations}
          yearsGiving={impactData.yearsGiving}
        />
      </div>

      {/* Row 4: Recent Donations Compact */}
      <RecentDonationsCompact donations={recentDonations} />
    </>
  );
}
