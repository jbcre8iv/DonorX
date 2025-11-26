"use client";

import { cn } from "@/lib/utils";
import type { RecurringInterval } from "@/types/database";

export type DonationFrequency = "one-time" | RecurringInterval;

interface FrequencySelectorProps {
  value: DonationFrequency;
  onChange: (frequency: DonationFrequency) => void;
}

const frequencies: { value: DonationFrequency; label: string; sublabel?: string }[] = [
  { value: "one-time", label: "One-time", sublabel: "Single donation" },
  { value: "monthly", label: "Monthly", sublabel: "Billed every month" },
  { value: "quarterly", label: "Quarterly", sublabel: "Billed every 3 months" },
  { value: "annually", label: "Annually", sublabel: "Billed once a year" },
];

export function FrequencySelector({ value, onChange }: FrequencySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {frequencies.map((freq) => (
        <button
          key={freq.value}
          type="button"
          onClick={() => onChange(freq.value)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all",
            value === freq.value
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <span className="text-sm font-medium">{freq.label}</span>
          {freq.sublabel && (
            <span className="mt-1 text-xs opacity-75">{freq.sublabel}</span>
          )}
        </button>
      ))}
    </div>
  );
}
