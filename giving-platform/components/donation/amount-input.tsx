"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const MAX_AMOUNT = 50_000_000; // $50 million

// Get the tier index that best contains a given amount
function getTierForAmount(amount: number): number {
  if (amount <= 1000) return 0;
  if (amount <= 15000) return 1;
  if (amount <= 150000) return 2;
  if (amount <= 750000) return 3;
  if (amount <= 2500000) return 4;
  if (amount <= 15000000) return 5;
  return 6;
}

// Map tier index to preset amounts
function getPresetsForTier(tierIndex: number): number[] {
  switch (tierIndex) {
    case 0: // $0 - $1,000 range
      return [25, 50, 100, 250, 500, 1000];
    case 1: // $1,000 - $15,000 range
      return [1000, 2500, 5000, 7500, 10000, 15000];
    case 2: // $10,000 - $150,000 range
      return [10000, 25000, 50000, 75000, 100000, 150000];
    case 3: // $100,000 - $750,000 range
      return [100000, 150000, 250000, 350000, 500000, 750000];
    case 4: // $500,000 - $2.5M range
      return [500000, 750000, 1000000, 1500000, 2000000, 2500000];
    case 5: // $1M - $15M range
      return [1000000, 2500000, 5000000, 7500000, 10000000, 15000000];
    case 6: // $10M - $50M range
    default:
      return [10000000, 15000000, 20000000, 25000000, 35000000, 50000000];
  }
}

// Get the range label based on tier index
function getRangeLabelForTier(tierIndex: number): string {
  switch (tierIndex) {
    case 0: return "$0 - $1,000";
    case 1: return "$1,000 - $15,000";
    case 2: return "$10,000 - $150,000";
    case 3: return "$100,000 - $750,000";
    case 4: return "$500,000 - $2.5M";
    case 5: return "$1M - $15M";
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
      // If it's a custom value, show it in the custom field
      setIsCustom(true);
      setCustomAmount(value.toString());
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const presetAmounts = getPresetsForTier(tierIndex);

  const handlePresetClick = (amount: number) => {
    setIsCustom(false);
    setCustomAmount("");
    onChange(amount);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(inputValue);
    setIsCustom(true);
    if (inputValue) {
      const parsedAmount = parseInt(inputValue, 10);
      // Cap at max amount
      onChange(Math.min(parsedAmount, MAX_AMOUNT));
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTierIndex = parseInt(e.target.value, 10);
    setTierIndex(newTierIndex);
    // When tier changes, select the first preset of the new tier
    const newPresets = getPresetsForTier(newTierIndex);
    if (!isCustom) {
      onChange(newPresets[0]);
    }
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
        <div className="relative pt-1">
          {/* Tick marks for tier thresholds */}
          <div className="absolute top-1 left-0 right-0 flex justify-between pointer-events-none" style={{ paddingLeft: '0px', paddingRight: '0px' }}>
            {[0, 1, 2, 3, 4, 5, 6].map((tick) => (
              <div
                key={tick}
                className={cn(
                  "w-0.5 h-4 rounded-full transition-colors",
                  tick <= tierIndex ? "bg-blue-400" : "bg-slate-300"
                )}
              />
            ))}
          </div>
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={tierIndex}
            onChange={handleRangeChange}
            className="relative z-10 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #1d4ed8 0%, #1d4ed8 ${(tierIndex / 6) * 100}%, #e2e8f0 ${(tierIndex / 6) * 100}%, #e2e8f0 100%)`,
            }}
          />
          {/* Tier labels */}
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span>$0</span>
            <span>$1K</span>
            <span>$15K</span>
            <span>$150K</span>
            <span>$750K</span>
            <span>$2.5M</span>
            <span>$50M</span>
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
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
