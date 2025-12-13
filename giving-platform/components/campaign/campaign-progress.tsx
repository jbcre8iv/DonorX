"use client";

import { formatCurrency } from "@/lib/utils";

interface CampaignProgressProps {
  raisedCents: number;
  goalCents: number;
  donationCount: number;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
}

export function CampaignProgress({
  raisedCents,
  goalCents,
  donationCount,
  showLabels = true,
  size = "md",
  color = "#059669",
}: CampaignProgressProps) {
  const percentage = goalCents > 0 ? Math.min((raisedCents / goalCents) * 100, 100) : 0;

  const heightClass = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }[size];

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between items-center mt-2">
          <div>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(raisedCents)}
            </span>
            <span className="text-sm text-slate-500 ml-1">
              raised of {formatCurrency(goalCents)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-slate-700">
              {percentage.toFixed(0)}%
            </span>
            <span className="text-sm text-slate-500 ml-2">
              {donationCount} {donationCount === 1 ? "donor" : "donors"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
