"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const MAX_AMOUNT = 50_000_000; // $50 million in cents conceptually, but we use dollars

// Tiers for the slider (matches the donation input tiers)
const TIERS = [
  { value: 0, label: "$0", amount: 0 },
  { value: 1, label: "$500", amount: 500 },
  { value: 2, label: "$5K", amount: 5000 },
  { value: 3, label: "$50K", amount: 50000 },
  { value: 4, label: "$250K", amount: 250000 },
  { value: 5, label: "$1M", amount: 1000000 },
  { value: 6, label: "$10M", amount: 10000000 },
  { value: 7, label: "$50M", amount: 50000000 },
];

function getTierForAmount(amount: number): number {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (amount >= TIERS[i].amount) return i;
  }
  return 0;
}

function getAmountForTier(tier: number): number {
  return TIERS[Math.min(tier, TIERS.length - 1)].amount;
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(1)}M`;
  } else if (amount >= 1000) {
    const thousands = amount / 1000;
    return thousands % 1 === 0 ? `$${thousands}K` : `$${thousands.toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

interface AmountRangeFilterProps {
  minAmount: number | null;
  maxAmount: number | null;
  onChange: (min: number | null, max: number | null) => void;
}

export function AmountRangeFilter({
  minAmount,
  maxAmount,
  onChange,
}: AmountRangeFilterProps) {
  // Convert props to tier indices for initial state
  const propMinTier = minAmount !== null ? getTierForAmount(minAmount) : 0;
  const propMaxTier = maxAmount !== null ? getTierForAmount(maxAmount) : TIERS.length - 1;

  // Local state for smooth sliding
  const [localMinTier, setLocalMinTier] = React.useState(propMinTier);
  const [localMaxTier, setLocalMaxTier] = React.useState(propMaxTier);

  // Sync local state when props change (e.g., from URL or reset)
  React.useEffect(() => {
    setLocalMinTier(propMinTier);
    setLocalMaxTier(propMaxTier);
  }, [propMinTier, propMaxTier]);

  // Handle real-time sliding (local state only)
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinTier = parseInt(e.target.value, 10);
    // Ensure min doesn't exceed max
    if (newMinTier <= localMaxTier) {
      setLocalMinTier(newMinTier);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxTier = parseInt(e.target.value, 10);
    // Ensure max doesn't go below min
    if (newMaxTier >= localMinTier) {
      setLocalMaxTier(newMaxTier);
    }
  };

  // Apply filter on mouse/touch release
  const applyFilter = () => {
    const newMin = localMinTier === 0 ? null : getAmountForTier(localMinTier);
    const newMax = localMaxTier === TIERS.length - 1 ? null : getAmountForTier(localMaxTier);
    onChange(newMin, newMax);
  };

  // Calculate the range label using local state for real-time updates
  const getRangeLabel = () => {
    const minLabel = localMinTier === 0 ? "$0" : formatAmount(getAmountForTier(localMinTier));
    const maxLabel = localMaxTier === TIERS.length - 1 ? "$50M+" : formatAmount(getAmountForTier(localMaxTier));
    return `${minLabel} - ${maxLabel}`;
  };

  // Calculate gradient positions using local state
  const minPercent = (localMinTier / (TIERS.length - 1)) * 100;
  const maxPercent = (localMaxTier / (TIERS.length - 1)) * 100;

  return (
    <div className="p-4 space-y-4 min-w-[280px]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Donation Amount</span>
        <span className="text-sm font-medium text-blue-600">{getRangeLabel()}</span>
      </div>

      {/* Dual Range Slider */}
      {/* Thumb is 20px wide (w-5), so we need 10px padding on each side for proper alignment */}
      <div className="relative pt-2 pb-6 px-[10px]">
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[10px] right-[10px] h-2 bg-slate-200 rounded-full" />

        {/* Active track - positioned within the inset track area */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 bg-blue-600 rounded-full left-[10px] right-[10px]"
          style={{
            clipPath: `inset(0 ${100 - maxPercent}% 0 ${minPercent}%)`,
          }}
        />

        {/* Min slider */}
        <input
          type="range"
          min="0"
          max={TIERS.length - 1}
          step="1"
          value={localMinTier}
          onChange={handleMinChange}
          onMouseUp={applyFilter}
          onTouchEnd={applyFilter}
          className="absolute left-0 right-0 h-2 appearance-none bg-transparent cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: localMinTier > localMaxTier - 1 ? 5 : 3 }}
        />

        {/* Max slider */}
        <input
          type="range"
          min="0"
          max={TIERS.length - 1}
          step="1"
          value={localMaxTier}
          onChange={handleMaxChange}
          onMouseUp={applyFilter}
          onTouchEnd={applyFilter}
          className="absolute left-0 right-0 h-2 appearance-none bg-transparent cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: 4 }}
        />

        {/* Tick marks - aligned with thumb center positions */}
        <div className="absolute top-6 left-[10px] right-[10px] flex justify-between">
          {TIERS.map((tier, i) => (
            <div
              key={tier.value}
              className={cn(
                "w-px h-2",
                i >= localMinTier && i <= localMaxTier ? "bg-blue-400" : "bg-slate-300"
              )}
            />
          ))}
        </div>

        {/* Labels - aligned with tick marks */}
        <div className="absolute top-9 left-[10px] right-[10px] flex justify-between">
          <span className="text-[10px] text-slate-400 -ml-2">$0</span>
          <span className="text-[10px] text-slate-400 -mr-2">$50M</span>
        </div>
      </div>

      {/* Reset button */}
      {(minAmount !== null || maxAmount !== null) && (
        <button
          onClick={() => onChange(null, null)}
          className="w-full text-xs text-slate-500 hover:text-slate-700 py-1"
        >
          Reset to any amount
        </button>
      )}
    </div>
  );
}
