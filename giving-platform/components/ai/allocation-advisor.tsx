"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, Lightbulb, PieChart, ArrowRight, X, ChevronDown, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";

export interface Allocation {
  name: string;
  percentage: number;
  amount: number;
  reason: string;
}

interface AlternativeStrategy {
  name: string;
  description: string;
}

interface AllocationAdvice {
  strategy: string;
  allocations: Allocation[];
  tips: string[];
  alternativeStrategies: AlternativeStrategy[];
}

interface NonprofitOption {
  id: string;
  name: string;
}

interface AllocationAdvisorProps {
  amount?: number;
  nonprofits?: NonprofitOption[];
  onApplyAllocation?: (allocations: Allocation[]) => void;
  className?: string;
}

export function AllocationAdvisor({
  amount: externalAmount,
  onApplyAllocation,
  className,
}: AllocationAdvisorProps) {
  // Use external amount if provided, otherwise allow manual input
  const hasExternalAmount = externalAmount !== undefined && externalAmount > 0;
  const pathname = usePathname();
  const { userId } = useCartFavorites();
  const { addToast } = useToast();
  const isLoggedIn = !!userId;
  const [goals, setGoals] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
  const [advice, setAdvice] = useState<AllocationAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // The actual amount to use for calculations
  const currentAmount = hasExternalAmount ? externalAmount : 0;

  const getAdvice = async (strategy?: string) => {
    // Check if user is logged in first
    if (!isLoggedIn) {
      addToast("Sign in to get AI allocation advice", "info", 4000, {
        label: "Sign in",
        href: `/login?redirect=${encodeURIComponent(pathname)}`,
      });
      return;
    }

    if (!currentAmount || currentAmount <= 0) {
      setError("Please set a donation amount above");
      return;
    }

    setIsLoading(true);
    setLoadingStrategy(strategy || null);
    setError(null);
    setRequiresLogin(false);

    try {
      const response = await fetch("/api/allocation-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent on mobile
        body: JSON.stringify({
          amount: currentAmount,
          goals: goals || undefined,
          strategy: strategy || undefined,
        }),
      });

      if (!response.ok) {
        // Get more specific error message
        if (response.status === 401) {
          setRequiresLogin(true);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAdvice(data);
      }
    } catch (err) {
      console.error("Allocation advice error:", err);
      const message = err instanceof Error ? err.message : "Unable to generate advice";
      setError(message === "Failed to fetch" ? "Network error. Please check your connection." : message);
    } finally {
      setIsLoading(false);
      setLoadingStrategy(null);
    }
  };

  const handleStrategyClick = (strategyName: string) => {
    setLoadingStrategy(strategyName);
    getAdvice(strategyName);
  };

  const getColorClass = (index: number) => {
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-amber-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    return colors[index % colors.length];
  };

  // Remove an allocation and redistribute percentages proportionally
  const handleRemoveAllocation = (indexToRemove: number) => {
    if (!advice) return;

    const remainingAllocations = advice.allocations.filter((_, i) => i !== indexToRemove);

    if (remainingAllocations.length === 0) {
      // If all allocations removed, clear advice
      setAdvice(null);
      return;
    }

    // Redistribute percentages proportionally
    const totalRemainingPercentage = remainingAllocations.reduce((sum, a) => sum + a.percentage, 0);

    const adjustedAllocations = remainingAllocations.map((alloc) => {
      const newPercentage = Math.round((alloc.percentage / totalRemainingPercentage) * 100);
      return {
        ...alloc,
        percentage: newPercentage,
        amount: (currentAmount * newPercentage) / 100,
      };
    });

    // Ensure percentages sum to 100 by adjusting the last one
    const totalPercentage = adjustedAllocations.reduce((sum, a) => sum + a.percentage, 0);
    if (totalPercentage !== 100 && adjustedAllocations.length > 0) {
      adjustedAllocations[adjustedAllocations.length - 1].percentage += 100 - totalPercentage;
      adjustedAllocations[adjustedAllocations.length - 1].amount =
        (currentAmount * adjustedAllocations[adjustedAllocations.length - 1].percentage) / 100;
    }

    setAdvice({
      ...advice,
      allocations: adjustedAllocations,
    });
  };

  return (
    <>
      {/* Full-screen loading modal */}
      {isLoading && advice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-emerald-100 rounded-full mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {loadingStrategy
                  ? `Applying "${loadingStrategy}"`
                  : "Generating Recommendations"}
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Our AI is analyzing your preferences and creating personalized allocation suggestions.
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full w-1/3"
                  style={{
                    animation: "indeterminate 1.5s ease-in-out infinite",
                  }}
                />
              </div>
              <style jsx>{`
                @keyframes indeterminate {
                  0% {
                    transform: translateX(-100%);
                  }
                  100% {
                    transform: translateX(400%);
                  }
                }
              `}</style>
              <p className="text-xs text-slate-500 mt-3">
                Just a moment...
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className={className}>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-emerald-600" />
          AI Allocation Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Form */}
        <div className="space-y-3">
          {/* Synced donation amount display */}
          {hasExternalAmount && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-700 mb-1">Donation Amount</p>
              <p className="text-2xl font-semibold text-emerald-900">
                {formatCurrency(currentAmount * 100)}
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                Synced from above
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Giving Goals (optional)
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g., I want to focus on education and support local organizations"
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
            />
          </div>
          <Button
            onClick={() => getAdvice()}
            disabled={!currentAmount || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Get AI Advice
              </>
            )}
          </Button>
        </div>

        {requiresLogin && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600 mb-3">
              Sign in to get personalized AI allocation recommendations based on your giving goals.
            </p>
            <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
              <Button variant="outline" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Sign in to continue
              </Button>
            </Link>
          </div>
        )}

        {error && !requiresLogin && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Results */}
        {advice && (
          <div className="space-y-6 pt-4 border-t border-slate-200">
            {/* Strategy Overview */}
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <h4 className="font-medium text-emerald-900 mb-2">
                Recommended Strategy
              </h4>
              <p className="text-sm text-emerald-800">{advice.strategy}</p>
            </div>

            {/* Visual Allocation Bar */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Allocation Breakdown
              </h4>
              <div className="h-6 rounded-full overflow-hidden flex">
                {advice.allocations.map((alloc, i) => (
                  <div
                    key={i}
                    className={`${getColorClass(i)} transition-all`}
                    style={{ width: `${alloc.percentage}%` }}
                    title={`${alloc.name}: ${alloc.percentage}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {advice.allocations.map((alloc, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div
                      className={`w-3 h-3 rounded-full ${getColorClass(i)}`}
                    />
                    <span className="text-xs text-slate-600">{alloc.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Allocation Details */}
            <div className="space-y-2">
              {advice.allocations.map((alloc, i) => {
                const isExpanded = expandedIndex === i;
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                  >
                    {/* Collapsed header - always visible */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${getColorClass(i)}`}
                        />
                        <h5 className="font-medium text-slate-900">{alloc.name}</h5>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-semibold text-slate-900 text-sm">
                            {formatCurrency(alloc.amount * 100)}
                          </p>
                          <p className="text-xs text-slate-500">{alloc.percentage}%</p>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-slate-100">
                        <p className="text-sm text-slate-600 mt-2">{alloc.reason}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAllocation(i);
                          }}
                          className="mt-3 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Remove allocation
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tips */}
            {advice.tips && advice.tips.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Tips
                </h4>
                <ul className="space-y-2">
                  {advice.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-600 flex items-start gap-2"
                    >
                      <span className="text-amber-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternative Strategies */}
            {advice.alternativeStrategies &&
              advice.alternativeStrategies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Try a Different Approach
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {advice.alternativeStrategies.map((strat, i) => {
                      const isStrategyLoading = loadingStrategy === strat.name;
                      return (
                        <button
                          key={i}
                          onClick={() => handleStrategyClick(strat.name)}
                          disabled={isLoading}
                          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                            isStrategyLoading
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50"
                          }`}
                          title={strat.description}
                        >
                          {isStrategyLoading && (
                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          )}
                          {strat.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Click a strategy to regenerate recommendations
                  </p>
                </div>
              )}

            {/* Apply Button */}
            {onApplyAllocation && (
              <Button
                onClick={() => onApplyAllocation(advice.allocations)}
                className="w-full"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Apply This Allocation
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
