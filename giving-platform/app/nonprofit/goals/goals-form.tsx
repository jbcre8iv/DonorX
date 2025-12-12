"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Target, Save, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DonationThermometer } from "@/components/ui/donation-thermometer";
import { formatCurrency } from "@/lib/utils";
import { updateFundraisingGoal } from "../actions";
import type { Nonprofit } from "@/types/database";

interface GoalsFormProps {
  nonprofit: Nonprofit;
  canEdit: boolean;
}

export function GoalsForm({ nonprofit, canEdit }: GoalsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Goal amount in dollars for display
  const [goalAmount, setGoalAmount] = React.useState<string>(
    nonprofit.fundraising_goal_cents
      ? (nonprofit.fundraising_goal_cents / 100).toString()
      : ""
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setGoalAmount(value);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const amountDollars = parseFloat(goalAmount);
      if (isNaN(amountDollars) || amountDollars < 0) {
        setError("Please enter a valid goal amount");
        setIsLoading(false);
        return;
      }

      const goalCents = Math.round(amountDollars * 100);
      const result = await updateFundraisingGoal(nonprofit.id, goalCents || null);

      if (!result.success) {
        setError(result.error || "Failed to update goal");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearGoal = async () => {
    if (!canEdit) return;
    if (!confirm("Are you sure you want to remove your fundraising goal?")) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateFundraisingGoal(nonprofit.id, null);

      if (!result.success) {
        setError(result.error || "Failed to clear goal");
        return;
      }

      setGoalAmount("");
      setSuccess(true);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const presetAmounts = [10000, 25000, 50000, 100000, 250000, 500000];
  const currentRaised = nonprofit.total_raised_cents || 0;
  const hasGoal = !!nonprofit.fundraising_goal_cents;

  return (
    <div className="space-y-6">
      {/* Current Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasGoal ? (
            <>
              <DonationThermometer
                current={currentRaised}
                goal={nonprofit.fundraising_goal_cents!}
                size="lg"
                showAmounts={true}
                showPercentage={true}
                animate={true}
              />
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-600">Total Raised</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(currentRaised)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">Goal</p>
                  <p className="text-2xl font-bold text-slate-700">
                    {formatCurrency(nonprofit.fundraising_goal_cents!)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-2">No fundraising goal set</p>
              <p className="text-sm text-slate-500">
                Total raised so far: <strong>{formatCurrency(currentRaised)}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set Goal Form */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>{hasGoal ? "Update Goal" : "Set a Fundraising Goal"}</CardTitle>
            <CardDescription>
              Setting a goal helps motivate donors and shows your progress on your public profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900">
                  Goal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={goalAmount}
                    onChange={handleAmountChange}
                    placeholder="Enter goal amount"
                    className="w-full h-12 rounded-lg border border-slate-200 bg-white pl-8 pr-4 text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              {/* Quick select amounts */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Quick Select
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setGoalAmount((amount / 100).toString());
                        setError(null);
                        setSuccess(false);
                      }}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                        parseFloat(goalAmount) === amount / 100
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {success && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Goal updated successfully
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  {hasGoal && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearGoal}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Goal
                    </Button>
                  )}
                  <Button type="submit" disabled={isLoading || !goalAmount}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {hasGoal ? "Update Goal" : "Set Goal"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Tips for Setting Effective Goals
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                <strong>Be specific:</strong> A clear target helps donors understand
                your needs.
              </li>
              <li>
                <strong>Be realistic:</strong> Set achievable goals based on your
                donor base and past performance.
              </li>
              <li>
                <strong>Communicate impact:</strong> Tell donors what reaching the
                goal will accomplish.
              </li>
              <li>
                <strong>Update regularly:</strong> Share progress updates to keep
                donors engaged.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
