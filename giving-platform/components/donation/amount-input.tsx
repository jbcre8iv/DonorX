"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const MAX_AMOUNT = 50_000_000; // $50 million

// Get the tier index that best contains a given amount
function getTierForAmount(amount: number): number {
  if (amount <= 500) return 0;
  if (amount <= 5000) return 1;
  if (amount <= 50000) return 2;
  if (amount <= 250000) return 3;
  if (amount <= 1000000) return 4;
  if (amount <= 10000000) return 5;
  return 6;
}

// Map tier index to preset amounts - no overlaps between tiers
function getPresetsForTier(tierIndex: number): number[] {
  switch (tierIndex) {
    case 0: // $0 - $500
      return [25, 50, 100, 150, 250, 500];
    case 1: // $500 - $5,000
      return [750, 1000, 1500, 2500, 3500, 5000];
    case 2: // $5,000 - $50,000
      return [7500, 10000, 15000, 25000, 35000, 50000];
    case 3: // $50,000 - $250,000
      return [75000, 100000, 125000, 150000, 200000, 250000];
    case 4: // $250,000 - $1M
      return [350000, 500000, 650000, 750000, 850000, 1000000];
    case 5: // $1M - $10M
      return [1500000, 2500000, 4000000, 5000000, 7500000, 10000000];
    case 6: // $10M - $50M
    default:
      return [15000000, 20000000, 25000000, 30000000, 40000000, 50000000];
  }
}

// Get the range label based on tier index
function getRangeLabelForTier(tierIndex: number): string {
  switch (tierIndex) {
    case 0: return "$0 - $500";
    case 1: return "$500 - $5,000";
    case 2: return "$5,000 - $50,000";
    case 3: return "$50,000 - $250,000";
    case 4: return "$250,000 - $1M";
    case 5: return "$1M - $10M";
    case 6:
    default: return "$10M - $50M";
  }
}

// Format amount with appropriate suffix (K, M)
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

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  minAmount?: number;
}

export function AmountInput({
  value,
  onChange,
  minAmount = 10,
}: AmountInputProps) {
  const [customAmount, setCustomAmount] = React.useState("");
  const [isCustom, setIsCustom] = React.useState(false);
  const [tierIndex, setTierIndex] = React.useState(() => getTierForAmount(value));

  // Sync tier when value changes externally (e.g., loading a template)
  React.useEffect(() => {
    const appropriateTier = getTierForAmount(value);
    if (appropriateTier !== tierIndex) {
      setTierIndex(appropriateTier);
    }
    // Also check if value matches a preset - if so, clear custom mode
    const presets = getPresetsForTier(appropriateTier);
    if (presets.includes(value)) {
      setIsCustom(false);
      setCustomAmount("");
    } else if (value > 0) {
      // If it's a custom value, show it in the custom field with formatting
      setIsCustom(true);
      setCustomAmount(value.toLocaleString());
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const presetAmounts = getPresetsForTier(tierIndex);

  const handlePresetClick = (amount: number) => {
    setIsCustom(false);
    setCustomAmount("");
    onChange(amount);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    const rawValue = e.target.value.replace(/[^0-9]/g, "");

    if (rawValue) {
      const parsedAmount = parseInt(rawValue, 10);
      // Cap at max amount
      const cappedAmount = Math.min(parsedAmount, MAX_AMOUNT);
      // Format with commas for display
      setCustomAmount(cappedAmount.toLocaleString());
      onChange(cappedAmount);
    } else {
      setCustomAmount("");
    }
    setIsCustom(true);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTierIndex = parseInt(e.target.value, 10);
    // Only update if tier actually changed
    if (newTierIndex !== tierIndex) {
      handleTierChange(newTierIndex);
    }
  };

  // Handle tier change from slider or label click
  const handleTierChange = (newTierIndex: number) => {
    if (newTierIndex === tierIndex) return; // No change needed

    setTierIndex(newTierIndex);
    // Select the first (smallest) preset of the new tier
    const newPresets = getPresetsForTier(newTierIndex);
    setIsCustom(false);
    setCustomAmount("");
    onChange(newPresets[0]);
  };

  return (
    <div className="space-y-6">
      {/* Range Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-900">
            Donation Range
          </label>
          <span className="text-sm font-medium text-blue-700">
            {getRangeLabelForTier(tierIndex)}
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={tierIndex}
            onChange={handleRangeChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #1d4ed8 0%, #1d4ed8 ${(tierIndex / 6) * 100}%, #e2e8f0 ${(tierIndex / 6) * 100}%, #e2e8f0 100%)`,
            }}
          />
          {/* Subtle tick marks - positioned to align with thumb center (11px = half of 22px thumb) */}
          <div className="relative mt-2 h-2" style={{ marginLeft: '11px', marginRight: '11px' }}>
            <div className="absolute inset-0 flex justify-between">
              {[0, 1, 2, 3, 4, 5, 6].map((tick) => (
                <div
                  key={tick}
                  className={cn(
                    "w-px h-2 rounded-full",
                    tick <= tierIndex ? "bg-blue-300" : "bg-slate-300"
                  )}
                />
              ))}
            </div>
          </div>
          {/* Min/Max labels only - aligned with tick marks */}
          <div className="flex justify-between mt-1 text-xs text-slate-400" style={{ marginLeft: '11px', marginRight: '11px' }}>
            <span className="-ml-2">$0</span>
            <span className="-mr-2">$50M</span>
          </div>
        </div>
      </div>

      {/* Preset Amounts */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-900">
          Quick Select
        </label>
        <div className="grid grid-cols-3 gap-3">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handlePresetClick(amount)}
              className={cn(
                "rounded-lg border-2 py-3 text-sm font-medium transition-all duration-200",
                value === amount && !isCustom
                  ? "border-blue-700 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
              )}
            >
              {formatAmount(amount)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-900">
          Custom Amount
        </label>
        <div className="relative">
          <span className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 font-medium pointer-events-none",
            isCustom && customAmount ? "text-slate-700" : "text-slate-400"
          )}>
            $
          </span>
          <Input
            type="text"
            value={customAmount}
            onChange={handleCustomChange}
            onFocus={() => setIsCustom(true)}
            placeholder="Enter custom amount"
            className={cn(
              "pl-7",
              isCustom && customAmount && "ring-2 ring-blue-700"
            )}
          />
        </div>
        <p className="text-xs text-slate-500">
          Minimum: ${minAmount.toLocaleString()} | Maximum: ${MAX_AMOUNT.toLocaleString()}
        </p>
      </div>

      {/* Current Selection Display */}
      {(value > 0) && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Selected Amount</span>
            <span className="text-lg font-bold text-blue-700">
              ${value.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
