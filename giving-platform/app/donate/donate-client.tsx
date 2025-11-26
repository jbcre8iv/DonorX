"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AmountInput } from "@/components/donation/amount-input";
import { AllocationBuilder, type AllocationItem } from "@/components/donation/allocation-builder";
import { FrequencySelector, type DonationFrequency } from "@/components/donation/frequency-selector";
import { formatCurrency } from "@/lib/utils";
import { createCheckoutSession, type AllocationInput } from "./actions";
import type { Nonprofit, Category } from "@/types/database";

interface DonateClientProps {
  nonprofits: Nonprofit[];
  categories: Category[];
  preselectedNonprofitId?: string;
}

export function DonateClient({
  nonprofits,
  categories,
  preselectedNonprofitId,
}: DonateClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";

  const [amount, setAmount] = React.useState(100000); // Start with first preset of middle range
  const [frequency, setFrequency] = React.useState<DonationFrequency>("one-time");
  const [allocations, setAllocations] = React.useState<AllocationItem[]>(() => {
    // If we have a preselected nonprofit, start with it
    if (preselectedNonprofitId) {
      const nonprofit = nonprofits.find((n) => n.id === preselectedNonprofitId);
      if (nonprofit) {
        return [
          {
            id: crypto.randomUUID(),
            type: "nonprofit",
            targetId: nonprofit.id,
            targetName: nonprofit.name,
            percentage: 100,
          },
        ];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isRecurring = frequency !== "one-time";

  const totalPercentage = allocations.reduce((sum, item) => sum + item.percentage, 0);
  const isValidAllocation = totalPercentage === 100;
  const amountCents = amount * 100;
  const isValidAmount = amountCents >= config.features.minDonationCents;

  const handleProceedToPayment = async () => {
    if (!isValidAllocation || !isValidAmount) return;

    setIsLoading(true);
    setError(null);

    const allocationInputs: AllocationInput[] = allocations.map((a) => ({
      type: a.type,
      targetId: a.targetId,
      targetName: a.targetName,
      percentage: a.percentage,
    }));

    try {
      const result = await createCheckoutSession(amountCents, allocationInputs, frequency);

      if (result.success && result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        setError(result.error || "Something went wrong. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Failed to process payment. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/directory"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Directory
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900">
            Make a Donation
          </h1>
          <p className="mt-2 text-slate-600">
            Allocate your contribution across multiple organizations
          </p>
        </div>

        {/* Canceled Notice */}
        {canceled && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Your payment was canceled. No charges were made. You can try again when ready.
            </p>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-8">
            {/* Amount Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Donation Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <AmountInput
                  value={amount}
                  onChange={setAmount}
                  minAmount={config.features.minDonationCents / 100}
                />
              </CardContent>
            </Card>

            {/* Frequency Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Donation Frequency</CardTitle>
                  {isRecurring && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Recurring
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <FrequencySelector value={frequency} onChange={setFrequency} />
                {isRecurring && (
                  <p className="mt-3 text-sm text-slate-500">
                    You can cancel or modify your recurring donation anytime from your dashboard.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Allocation Builder */}
            <AllocationBuilder
              allocations={allocations}
              onAllocationsChange={setAllocations}
              totalAmountCents={amountCents}
              nonprofits={nonprofits}
              categories={categories}
            />
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Donation Amount</span>
                    <span className="font-medium">{formatCurrency(amountCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Frequency</span>
                    <span className="font-medium capitalize">
                      {frequency === "one-time" ? "One-time" : frequency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Platform Fee</span>
                    <span className="font-medium text-emerald-600">$0.00</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">
                        {formatCurrency(amountCents)}
                        {isRecurring && <span className="text-sm font-normal text-slate-500">/{frequency === "monthly" ? "mo" : frequency === "quarterly" ? "qtr" : "yr"}</span>}
                      </span>
                    </div>
                  </div>

                  {/* Allocation Summary */}
                  {allocations.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-sm font-medium text-slate-900 mb-3">
                        Allocation Breakdown
                      </p>
                      <div className="space-y-2">
                        {allocations.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-slate-600 truncate mr-2">
                              {item.targetName}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(Math.round((amountCents * item.percentage) / 100))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    fullWidth
                    size="lg"
                    disabled={!isValidAllocation || !isValidAmount || isLoading}
                    className="mt-4"
                    onClick={handleProceedToPayment}
                    loading={isLoading}
                  >
                    {isRecurring ? (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    {isLoading
                      ? "Processing..."
                      : isRecurring
                        ? "Set Up Recurring Donation"
                        : "Proceed to Payment"}
                  </Button>

                  {!isValidAllocation && allocations.length > 0 && (
                    <p className="text-sm text-red-600 text-center">
                      Please allocate exactly 100% of your donation
                    </p>
                  )}

                  {allocations.length === 0 && (
                    <p className="text-sm text-amber-600 text-center">
                      Add at least one nonprofit or category to your allocation
                    </p>
                  )}

                  {!isValidAmount && (
                    <p className="text-sm text-red-600 text-center">
                      Minimum donation is ${config.features.minDonationCents / 100}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 text-center">
                    Secured by Stripe. You&apos;ll receive a single tax receipt for
                    your entire donation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
