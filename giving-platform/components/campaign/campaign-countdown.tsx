"use client";

import * as React from "react";
import { Clock } from "lucide-react";

interface CampaignCountdownProps {
  endDate: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(endDate: string): TimeLeft {
  const difference = new Date(endDate).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

export function CampaignCountdown({ endDate, className = "" }: CampaignCountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>(() => calculateTimeLeft(endDate));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.total <= 0) {
    return (
      <div className={`flex items-center gap-2 text-slate-500 ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Campaign ended</span>
      </div>
    );
  }

  // If more than 7 days, just show days
  if (timeLeft.days > 7) {
    return (
      <div className={`flex items-center gap-2 text-slate-700 ${className}`}>
        <Clock className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium">{timeLeft.days} days left</span>
      </div>
    );
  }

  // Show detailed countdown
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Clock className="h-4 w-4 text-emerald-600" />
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <TimeUnit value={timeLeft.days} label="d" />
        )}
        <TimeUnit value={timeLeft.hours} label="h" />
        <TimeUnit value={timeLeft.minutes} label="m" />
        {timeLeft.days === 0 && (
          <TimeUnit value={timeLeft.seconds} label="s" />
        )}
      </div>
      <span className="text-xs text-slate-500">left</span>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline">
      <span className="text-sm font-bold text-slate-900 tabular-nums">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

// Compact version for cards
export function CampaignCountdownCompact({ endDate }: { endDate: string }) {
  const timeLeft = calculateTimeLeft(endDate);

  if (timeLeft.total <= 0) {
    return <span className="text-xs text-slate-500">Ended</span>;
  }

  if (timeLeft.days > 0) {
    return (
      <span className="text-xs font-medium text-emerald-600">
        {timeLeft.days}d left
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-amber-600">
      {timeLeft.hours}h {timeLeft.minutes}m left
    </span>
  );
}
