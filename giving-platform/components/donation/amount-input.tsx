"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

// Map slider position (0-6) to amount
function getAmountForPosition(position: number, minAmount: number, maxAmount: number): number {
  const range = maxAmount - minAmount;
  // Round to nearest 100 for cleaner values
  return Math.round((minAmount + (position / 6) * range) / 100) * 100;
}

// Map amount to slider position (0-6)
function getPositionForAmount(amount: number, minAmount: number, maxAmount: number): number {
  const range = maxAmount - minAmount;
  const position = ((amount - minAmount) / range) * 6;
  return Math.max(0, Math.min(6, position));
}

// Generate 4 increment amounts for a given slider position
function getIncrementsForPosition(position: number, minAmount: number, maxAmount: number): number[] {
  const baseAmount = getAmountForPosition(position, minAmount, maxAmount);
  const range = maxAmount - minAmount;
  const stepSize = range / 6; // Amount per slider tick
  const incrementStep = Math.round(stepSize / 4 / 100) * 100; // Divide each tick into 4 parts, round to 100

  // Generate 4 increments around the base amount
  const increments: number[] = [];

  // Start from the base amount and create 4 evenly spaced amounts within this tick range
  for (let i = 0; i < 4; i++) {
    const amount = Math.round((baseAmount + (i * incrementStep)) / 100) * 100;
    // Ensure we don't exceed max or go below min
    const clampedAmount = Math.max(minAmount, Math.min(maxAmount, amount));
    if (!increments.includes(clampedAmount)) {
      increments.push(clampedAmount);
    }
  }

  // Ensure we have exactly 4 unique values
  while (increments.length < 4) {
    const lastAmount = increments[increments.length - 1];
    const nextAmount = Math.min(maxAmount, lastAmount + incrementStep);
    if (!increments.includes(nextAmount)) {
      increments.push(nextAmount);
    } else {
      break;
    }
  }

  return increments.slice(0, 4);
}

// Format amount with appropriate suffix (K)
function formatAmount(amount: number): string {
  if (amount >= 1000) {
    const thousands = amount / 1000;
    return thousands % 1 === 0 ? `$${thousands}K` : `$${thousands.toFixed(1)}K`;
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

  // Calculate slider position based on current value
  const sliderPosition = Math.round(getPositionForAmount(value, minAmount, maxAmount));

  // Get dynamic increment amounts for current slider position
  const incrementAmounts = React.useMemo(
    () => getIncrementsForPosition(sliderPosition, minAmount, maxAmount),
    [sliderPosition, minAmount, maxAmount]
  );

  // Update custom amount display when value changes (and not manually editing)
  React.useEffect(() => {
    if (!isCustomFocused) {
      setCustomAmount(value > 0 ? value.toLocaleString() : "");
    }
  }, [value, isCustomFocused]);

  const handlePresetClick = (amount: number) => {
    onChange(amount);
    setCustomAmount(amount.toLocaleString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const newValue = getAmountForPosition(position, minAmount, maxAmount);
    onChange(newValue);
    setCustomAmount(newValue.toLocaleString());
  };

  const requiresAchOrCheck = value > creditCardMax;

  return (
    <div className="space-y-6">
      {/* Range Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-900">
            Donation Range
          </label>
          <span className="text-sm font-medium text-blue-700">
            ${minAmount.toLocaleString()} - ${maxAmount.toLocaleString()}
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

      {/* Dynamic Increment Amounts */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-900">
          Quick Select
        </label>
        <div className="grid grid-cols-2 gap-3">
          {incrementAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handlePresetClick(amount)}
              className={cn(
                "rounded-lg border-2 py-3 text-sm font-medium transition-all duration-200",
                value === amount
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
            onFocus={() => setIsCustomFocused(true)}
            onBlur={() => setIsCustomFocused(false)}
            placeholder="Enter custom amount"
            className={cn(
              "pl-7",
              isCustomFocused && "ring-2 ring-blue-700"
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
                Donations over $10,000 require ACH bank transfer or check payment.
                Credit card payments are limited to $10,000 or less.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
