"use client";

import { Heart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CoverFeesCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  donationAmount: number; // in dollars
  feePercentage?: number; // default 0.03 (3%)
}

export function CoverFeesCheckbox({
  checked,
  onChange,
  donationAmount,
  feePercentage = 0.03,
}: CoverFeesCheckboxProps) {
  // donationAmount is in dollars, convert to cents for calculations
  const donationAmountCents = donationAmount * 100;
  // Calculate fee amount in cents (round up)
  const feeAmountCents = Math.ceil(donationAmountCents * feePercentage);

  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-5 w-5 rounded border-2 border-slate-300 bg-white transition-all peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 group-hover:border-slate-400 peer-checked:group-hover:border-emerald-600">
          {checked && (
            <svg
              className="h-full w-full text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">
            Add {formatCurrency(feeAmountCents)} to cover processing fees
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          100% of your {formatCurrency(donationAmountCents)} donation will go directly to the nonprofits
        </p>
      </div>
    </label>
  );
}

// Helper function to calculate fee amount in cents
export function calculateFeeAmountCents(donationAmountCents: number, feePercentage = 0.03): number {
  return Math.ceil(donationAmountCents * feePercentage);
}
