"use client";

import * as React from "react";
import { Heart, Loader2, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { WidgetToken, Nonprofit } from "@/types/database";

interface WidgetDonationFormProps {
  widget: WidgetToken & { nonprofit: Nonprofit };
}

export function WidgetDonationForm({ widget }: WidgetDonationFormProps) {
  const { nonprofit } = widget;
  const [amount, setAmount] = React.useState<number | null>(null);
  const [customAmount, setCustomAmount] = React.useState("");
  const [coverFees, setCoverFees] = React.useState(false);
  const [isAnonymous, setIsAnonymous] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Calculate amounts
  const donationAmountCents = amount || (parseFloat(customAmount) * 100) || 0;
  const feeAmountCents = coverFees ? Math.ceil(donationAmountCents * 0.03) : 0;
  const totalAmountCents = donationAmountCents + feeAmountCents;

  const handlePresetClick = (presetCents: number) => {
    setAmount(presetCents);
    setCustomAmount("");
    setError(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setCustomAmount(value);
    setAmount(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (donationAmountCents < widget.min_amount_cents) {
      setError(`Minimum donation is ${formatCurrency(widget.min_amount_cents)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/widget/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetToken: widget.token,
          nonprofitId: nonprofit.id,
          amountCents: donationAmountCents,
          coverFees,
          feeAmountCents,
          isAnonymous,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const primaryColor = widget.primary_color || "#059669";

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="p-4 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          {nonprofit.logo_url ? (
            <img
              src={nonprofit.logo_url}
              alt={nonprofit.name}
              className="h-12 w-12 rounded-lg object-contain bg-white p-1"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Building2 className="h-6 w-6" />
            </div>
          )}
          <div>
            <h2 className="font-semibold text-lg">{nonprofit.name}</h2>
            <p className="text-sm opacity-90">Make a donation</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Preset Amounts */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Amount
          </label>
          <div className="grid grid-cols-2 gap-2">
            {widget.preset_amounts.map((presetCents) => (
              <button
                key={presetCents}
                type="button"
                onClick={() => handlePresetClick(presetCents)}
                className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                  amount === presetCents
                    ? "text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
                style={
                  amount === presetCents
                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                    : {}
                }
              >
                {formatCurrency(presetCents)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        {widget.allow_custom_amount && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Or enter custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="0.00"
                className={`w-full h-12 rounded-lg border-2 pl-8 pr-4 text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                  amount === null && customAmount
                    ? ""
                    : "border-slate-200 focus:border-slate-300"
                }`}
                style={
                  amount === null && customAmount
                    ? { borderColor: primaryColor }
                    : {}
                }
              />
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 pt-2">
          {/* Cover Fees */}
          {widget.show_cover_fees && donationAmountCents > 0 && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={coverFees}
                onChange={(e) => setCoverFees(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
                style={{ accentColor: primaryColor }}
              />
              <div className="text-sm">
                <span className="font-medium text-slate-700">
                  Add {formatCurrency(Math.ceil(donationAmountCents * 0.03))} to cover fees
                </span>
                <p className="text-slate-500">
                  100% of your donation goes to the nonprofit
                </p>
              </div>
            </label>
          )}

          {/* Anonymous */}
          {widget.show_anonymous && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
                style={{ accentColor: primaryColor }}
              />
              <span className="text-sm font-medium text-slate-700">
                Make my donation anonymous
              </span>
            </label>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Total & Submit */}
        <div className="pt-2">
          {donationAmountCents > 0 && (
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-slate-600">Total</span>
              <span className="font-semibold text-slate-900 text-lg">
                {formatCurrency(totalAmountCents)}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || donationAmountCents < widget.min_amount_cents}
            className="w-full h-12 rounded-lg text-white font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Heart className="h-5 w-5" />
                {widget.button_text || "Donate Now"}
              </>
            )}
          </button>
        </div>

        {/* Powered by */}
        <p className="text-center text-xs text-slate-400 pt-2">
          Powered by{" "}
          <a
            href="https://donor-x.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-slate-600"
          >
            DonorX
          </a>
        </p>
      </form>
    </div>
  );
}
