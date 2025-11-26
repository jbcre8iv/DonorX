"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const presetAmounts = [100, 250, 500, 1000, 2500, 5000];

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
      onChange(parseInt(inputValue, 10));
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-900">
        Donation Amount
      </label>

      {/* Preset Amounts */}
      <div className="grid grid-cols-3 gap-3">
        {presetAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handlePresetClick(amount)}
            className={cn(
              "rounded-lg border-2 py-3 text-sm font-medium transition-colors",
              value === amount && !isCustom
                ? "border-blue-700 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            ${amount.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Custom Amount */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
          $
        </span>
        <Input
          type="text"
          value={customAmount}
          onChange={handleCustomChange}
          onFocus={() => setIsCustom(true)}
          placeholder="Other amount"
          className={cn(
            "pl-7",
            isCustom && customAmount && "ring-2 ring-blue-700"
          )}
        />
      </div>

      {/* Minimum Amount Notice */}
      <p className="text-xs text-slate-500">
        Minimum donation: ${minAmount.toLocaleString()}
      </p>
    </div>
  );
}
