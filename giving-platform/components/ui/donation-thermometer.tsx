"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface DonationThermometerProps {
  current: number; // raised amount in cents
  goal?: number; // goal amount in cents (optional)
  variant?: "vertical" | "horizontal";
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  showAmounts?: boolean;
  animate?: boolean;
  className?: string;
}

export function DonationThermometer({
  current,
  goal,
  variant = "horizontal",
  size = "md",
  showPercentage = true,
  showAmounts = true,
  animate = true,
  className,
}: DonationThermometerProps) {
  // Calculate percentage (cap at 100% for display, but show actual percentage in text)
  const percentage = goal && goal > 0 ? (current / goal) * 100 : 0;
  const cappedPercentage = Math.min(percentage, 100);
  const hasGoal = goal !== undefined && goal > 0;

  // Size configurations
  const sizeConfig = {
    sm: {
      height: "h-2",
      width: "w-full",
      verticalHeight: "h-32",
      verticalWidth: "w-4",
      text: "text-xs",
      labelText: "text-sm",
    },
    md: {
      height: "h-3",
      width: "w-full",
      verticalHeight: "h-48",
      verticalWidth: "w-6",
      text: "text-sm",
      labelText: "text-base",
    },
    lg: {
      height: "h-4",
      width: "w-full",
      verticalHeight: "h-64",
      verticalWidth: "w-8",
      text: "text-base",
      labelText: "text-lg",
    },
  };

  const config = sizeConfig[size];

  // Color based on progress
  const getProgressColor = () => {
    if (!hasGoal) return "bg-blue-500";
    if (percentage >= 100) return "bg-emerald-500";
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-blue-500";
  };

  if (variant === "vertical") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        {showAmounts && hasGoal && (
          <span className={cn("font-semibold text-slate-700", config.labelText)}>
            {formatCurrency(goal / 100)}
          </span>
        )}
        <div
          className={cn(
            "relative rounded-full bg-slate-200 overflow-hidden",
            config.verticalHeight,
            config.verticalWidth
          )}
        >
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 rounded-full",
              getProgressColor(),
              animate && "transition-all duration-1000 ease-out"
            )}
            style={{ height: `${cappedPercentage}%` }}
          />
        </div>
        {showAmounts && (
          <span className={cn("font-semibold text-slate-900", config.labelText)}>
            {formatCurrency(current / 100)}
          </span>
        )}
        {showPercentage && hasGoal && (
          <span className={cn("text-slate-500", config.text)}>
            {Math.round(percentage)}% of goal
          </span>
        )}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn("w-full", className)}>
      {showAmounts && (
        <div className="flex justify-between items-baseline mb-2">
          <span className={cn("font-semibold text-slate-900", config.labelText)}>
            {formatCurrency(current / 100)} raised
          </span>
          {hasGoal && (
            <span className={cn("text-slate-500", config.text)}>
              of {formatCurrency(goal / 100)} goal
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "relative rounded-full bg-slate-200 overflow-hidden",
          config.height,
          config.width
        )}
      >
        <div
          className={cn(
            "absolute top-0 left-0 bottom-0 rounded-full",
            getProgressColor(),
            animate && "transition-all duration-1000 ease-out"
          )}
          style={{ width: hasGoal ? `${cappedPercentage}%` : "100%" }}
        />
      </div>
      {showPercentage && hasGoal && (
        <div className="mt-1 text-right">
          <span className={cn("text-slate-500", config.text)}>
            {Math.round(percentage)}%{percentage > 100 && " - Goal exceeded!"}
          </span>
        </div>
      )}
    </div>
  );
}
