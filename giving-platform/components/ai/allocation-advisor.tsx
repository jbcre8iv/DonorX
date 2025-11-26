"use client";

import { useState } from "react";
import { Sparkles, Loader2, Lightbulb, PieChart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Allocation {
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

interface AllocationAdvisorProps {
  amount?: number;
  onApplyAllocation?: (allocations: Allocation[]) => void;
  className?: string;
}

export function AllocationAdvisor({
  amount: initialAmount,
  onApplyAllocation,
  className,
}: AllocationAdvisorProps) {
  const [amount, setAmount] = useState(initialAmount?.toString() || "");
  const [goals, setGoals] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<AllocationAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAdvice = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid donation amount");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/allocation-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          goals: goals || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get advice");
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAdvice(data);
      }
    } catch (err) {
      console.error("Allocation advice error:", err);
      setError("Unable to generate advice. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

  return (
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Donation Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="pl-7"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Giving Goals (optional)
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g., I want to focus on education and support local organizations"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <Button
            onClick={getAdvice}
            disabled={!amount || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Advice
              </>
            )}
          </Button>
        </div>

        {error && (
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
            <div className="space-y-3">
              {advice.allocations.map((alloc, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-slate-200 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getColorClass(i)}`}
                        />
                        <h5 className="font-medium text-slate-900">{alloc.name}</h5>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{alloc.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(alloc.amount * 100)}
                      </p>
                      <p className="text-sm text-slate-500">{alloc.percentage}%</p>
                    </div>
                  </div>
                </div>
              ))}
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
                    Alternative Strategies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {advice.alternativeStrategies.map((strat, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-slate-100"
                        title={strat.description}
                      >
                        {strat.name}
                      </Badge>
                    ))}
                  </div>
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
  );
}
