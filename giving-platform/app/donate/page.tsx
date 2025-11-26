"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmountInput } from "@/components/donation/amount-input";
import { AllocationBuilder, type AllocationItem } from "@/components/donation/allocation-builder";
import { formatCurrency } from "@/lib/utils";

export default function DonatePage() {
  const [amount, setAmount] = React.useState(1000);
  const [allocations, setAllocations] = React.useState<AllocationItem[]>([
    {
      id: "1",
      type: "nonprofit",
      targetId: "1",
      targetName: "Education First Foundation",
      percentage: 40,
    },
    {
      id: "2",
      type: "nonprofit",
      targetId: "2",
      targetName: "Green Earth Initiative",
      percentage: 35,
    },
    {
      id: "3",
      type: "category",
      targetId: "3",
      targetName: "Healthcare",
      percentage: 25,
    },
  ]);

  const totalPercentage = allocations.reduce((sum, item) => sum + item.percentage, 0);
  const isValidAllocation = totalPercentage === 100;
  const amountCents = amount * 100;

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

            {/* Allocation Builder */}
            <AllocationBuilder
              allocations={allocations}
              onAllocationsChange={setAllocations}
              totalAmountCents={amountCents}
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
                    <span className="text-slate-600">Platform Fee</span>
                    <span className="font-medium text-emerald-600">$0.00</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">{formatCurrency(amountCents)}</span>
                    </div>
                  </div>

                  {/* Allocation Summary */}
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

                  <Button
                    fullWidth
                    size="lg"
                    disabled={!isValidAllocation || amount < config.features.minDonationCents / 100}
                    className="mt-4"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Proceed to Payment
                  </Button>

                  {!isValidAllocation && (
                    <p className="text-sm text-red-600 text-center">
                      Please allocate exactly 100% of your donation
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
