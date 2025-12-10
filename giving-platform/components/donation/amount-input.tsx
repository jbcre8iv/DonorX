"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

// Define the 7 tick positions with their base amounts (rounded to $500)
const TICK_AMOUNTS = [1000, 4000, 7000, 10500, 13500, 17000, 20000];

// Get the range for a given tick position (start and end amounts)
function getRangeForPosition(position: number): { start: number; end: number } {
  const start = TICK_AMOUNTS[position];
  const end = position < 6 ? TICK_AMOUNTS[position + 1] : TICK_AMOUNTS[position];
  return { start, end };
}

// Generate 4 button amounts for a given tick position (all rounded to $500)
function getButtonAmountsForPosition(position: number): number[] {
  const { start, end } = getRangeForPosition(position);

  if (position === 6) {
    // Last position - show amounts leading up to max
    return [18500, 19000, 19500, 20000];
  }

  const range = end - start;
  const step = Math.round(range / 4 / 500) * 500; // Round step to nearest $500

  const amounts: number[] = [];
  for (let i = 0; i < 4; i++) {
    const amount = start + (i * step);
    // Round to nearest $500
    const rounded = Math.round(amount / 500) * 500;
    if (!amounts.includes(rounded) && rounded >= 1000 && rounded <= 20000) {
      amounts.push(rounded);
    }
  }

  // Ensure we have 4 unique amounts
  while (amounts.length < 4) {
    const lastAmount = amounts[amounts.length - 1];
    const nextAmount = lastAmount + 500;
    if (nextAmount <= 20000 && !amounts.includes(nextAmount)) {
      amounts.push(nextAmount);
    } else {
      break;
    }
  }

  return amounts.slice(0, 4);
}

// Format amount with K suffix (no decimals since all amounts are $500 increments)
function formatAmount(amount: number): string {
  if (amount >= 1000) {
    const thousands = amount / 1000;
    // Show .5 for half thousands, otherwise whole number
    return thousands % 1 === 0 ? `$${thousands}K` : `$${thousands.toFixed(1).replace('.0', '')}K`;
  }
  return `$${amount.toLocaleString()}`;
}

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  minAmount?: number;
  maxAmount?: number;
  creditCardMax?: number;
}

export function AmountInput({
  value,
  onChange,
  minAmount = 1000,
  maxAmount = 20000,
  creditCardMax = 10000,
}: AmountInputProps) {
  const [customAmount, setCustomAmount] = React.useState("");
  const [isCustomFocused, setIsCustomFocused] = React.useState(false);
  const [isUsingCustom, setIsUsingCustom] = React.useState(false);

  // Calculate slider position based on current value
  const sliderPosition = React.useMemo(() => {
    // Find which tick position is closest to the current value
    let closestPosition = 0;
    let closestDiff = Math.abs(value - TICK_AMOUNTS[0]);

    for (let i = 1; i < TICK_AMOUNTS.length; i++) {
      const diff = Math.abs(value - TICK_AMOUNTS[i]);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestPosition = i;
      }
    }
    return closestPosition;
  }, [value]);

  // Get the current range based on slider position
  const currentRange = React.useMemo(() => getRangeForPosition(sliderPosition), [sliderPosition]);

  // Get dynamic button amounts for current slider position
  const buttonAmounts = React.useMemo(
    () => getButtonAmountsForPosition(sliderPosition),
    [sliderPosition]
  );

  // Check if current value matches one of the button amounts
  const isPresetSelected = buttonAmounts.includes(value);

  // Update custom amount display only when using custom input
  React.useEffect(() => {
    if (isUsingCustom && !isCustomFocused) {
      setCustomAmount(value > 0 ? value.toLocaleString() : "");
    } else if (!isUsingCustom) {
      setCustomAmount("");
    }
  }, [value, isCustomFocused, isUsingCustom]);

  const handlePresetClick = (amount: number) => {
    setIsUsingCustom(false);
    setCustomAmount("");
    onChange(amount);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUsingCustom(true);
    // Remove all non-digits
    const rawValue = e.target.value.replace(/[^0-9]/g, "");

    if (rawValue) {
      const parsedAmount = parseInt(rawValue, 10);
      // Cap at max amount
      const cappedAmount = Math.min(parsedAmount, maxAmount);
      // Format with commas for display
      setCustomAmount(cappedAmount.toLocaleString());
      onChange(cappedAmount);
    } else {
      setCustomAmount("");
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseInt(e.target.value, 10);
    const newValue = TICK_AMOUNTS[position];
    setIsUsingCustom(false);
    setCustomAmount("");
    onChange(newValue);
  };

  const handleCustomFocus = () => {
    setIsCustomFocused(true);
    setIsUsingCustom(true);
    if (value > 0) {
      setCustomAmount(value.toLocaleString());
    }
  };

  const handleCustomBlur = () => {
    setIsCustomFocused(false);
  };

  const requiresAchOrCheck = value > creditCardMax;

  return (
    <div className="space-y-6">
      {/* Range Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-900">
            Select Range
          </label>
          <span className="text-sm font-medium text-blue-700">
            ${currentRange.start.toLocaleString()} - ${currentRange.end.toLocaleString()}
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={sliderPosition}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #1d4ed8 0%, #1d4ed8 ${(sliderPosition / 6) * 100}%, #e2e8f0 ${(sliderPosition / 6) * 100}%, #e2e8f0 100%)`,
            }}
          />
          {/* Tick marks - positioned to align with slider positions */}
          <div className="relative mt-2 h-2 mx-[11px]">
            <div className="absolute inset-0 flex justify-between">
              {[0, 1, 2, 3, 4, 5, 6].map((tick) => (
                <div
                  key={tick}
                  className={cn(
                    "w-px h-2 rounded-full",
                    tick <= sliderPosition ? "bg-blue-300" : "bg-slate-300"
                  )}
                />
              ))}
            </div>
          </div>
          {/* Min/Max labels */}
          <div className="flex justify-between mt-1 text-xs text-slate-400 mx-[11px]">
            <span className="-ml-2">${minAmount.toLocaleString()}</span>
            <span className="-mr-2">${maxAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Button Amounts */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-900">
          Quick Select
        </label>
        <div className="grid grid-cols-2 gap-3">
          {buttonAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handlePresetClick(amount)}
              className={cn(
                "rounded-lg border-2 py-3 text-sm font-medium transition-all duration-200",
                value === amount && !isUsingCustom
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
            customAmount ? "text-slate-700" : "text-slate-400"
          )}>
            $
          </span>
          <Input
            type="text"
            value={customAmount}
            onChange={handleCustomChange}
            onFocus={handleCustomFocus}
            onBlur={handleCustomBlur}
            placeholder="Enter custom amount"
            className={cn(
              "pl-7",
              isUsingCustom && customAmount && "ring-2 ring-blue-700"
            )}
          />
        </div>
        <p className="text-xs text-slate-500">
          Minimum: ${minAmount.toLocaleString()} | Maximum: ${maxAmount.toLocaleString()}
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

      {/* ACH/Check Required Notice */}
      {requiresAchOrCheck && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Large donation payment options
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Donations over ${creditCardMax.toLocaleString()} require ACH bank transfer or check payment.
                Credit card payments are limited to ${creditCardMax.toLocaleString()} or less.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
