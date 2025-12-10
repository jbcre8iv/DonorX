"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

// Preset amounts for the $1,000 - $20,000 range
const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 15000, 20000];

// Slider tick positions (0-6 for 7 ticks) with corresponding amounts
const SLIDER_TICKS = [
  { position: 0, amount: 1000 },
  { position: 1, amount: 4167 },
  { position: 2, amount: 7333 },
  { position: 3, amount: 10500 },
  { position: 4, amount: 13667 },
  { position: 5, amount: 16833 },
  { position: 6, amount: 20000 },
];

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
  const [isCustom, setIsCustom] = React.useState(false);

  // Check if value matches a preset
  React.useEffect(() => {
    if (PRESET_AMOUNTS.includes(value)) {
      setIsCustom(false);
      setCustomAmount("");
    } else if (value > 0 && !PRESET_AMOUNTS.includes(value)) {
      setIsCustom(true);
      setCustomAmount(value.toLocaleString());
    }
  }, [value]);

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
      const cappedAmount = Math.min(parsedAmount, maxAmount);
      // Format with commas for display
      setCustomAmount(cappedAmount.toLocaleString());
      onChange(cappedAmount);
    } else {
      setCustomAmount("");
    }
    setIsCustom(true);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseInt(e.target.value, 10);
    const newValue = getAmountForPosition(position, minAmount, maxAmount);
    onChange(newValue);
    // Check if it matches a preset
    if (!PRESET_AMOUNTS.includes(newValue)) {
      setIsCustom(true);
      setCustomAmount(newValue.toLocaleString());
    } else {
      setIsCustom(false);
      setCustomAmount("");
    }
  };

  const requiresAchOrCheck = value > 10000;
  // Calculate nearest tick position for the slider
  const sliderPosition = Math.round(getPositionForAmount(value, minAmount, maxAmount));

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

      {/* Preset Amounts */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-900">
          Quick Select
        </label>
        <div className="grid grid-cols-3 gap-3">
          {PRESET_AMOUNTS.map((amount) => (
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
