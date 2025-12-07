"use client";

import { useState, useEffect } from "react";
import { Target, Edit2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface GivingGoalWidgetProps {
  currentAmount: number;
  goalAmount: number;
  year: number;
  onGoalChange?: (newGoal: number) => void;
}

export function GivingGoalWidget({
  currentAmount,
  goalAmount,
  year,
  onGoalChange,
}: GivingGoalWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  const percentage = goalAmount > 0 ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;
  const remaining = Math.max(goalAmount - currentAmount, 0);

  // Animate the progress ring
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSave = () => {
    const newGoal = parseInt(editValue.replace(/[^0-9]/g, ""), 10);
    if (newGoal > 0 && onGoalChange) {
      onGoalChange(newGoal * 100); // Convert to cents
    }
    setIsEditing(false);
  };

  // Calculate stroke dasharray for the progress ring
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{year} Giving Goal</CardTitle>
          {onGoalChange && !isEditing && (
            <button
              onClick={() => {
                setEditValue((goalAmount / 100).toString());
                setIsEditing(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative w-[80px] h-[80px] flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={percentage >= 100 ? "#10b981" : "#3b82f6"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-lg font-bold text-slate-900">
                  {Math.round(animatedPercentage)}%
                </span>
              </div>
            </div>
          </div>

          {/* Goal Info */}
          <div className="flex-1 space-y-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">$</span>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-24 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Goal:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(goalAmount)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-600">Donated: </span>
                  <span className="font-semibold text-emerald-600">
                    <AnimatedNumber value={Math.round(currentAmount / 100)} format="currency" />
                  </span>
                </div>
                {remaining > 0 ? (
                  <div className="text-sm text-slate-500">
                    {formatCurrency(remaining)} to go
                  </div>
                ) : (
                  <div className="text-sm text-emerald-600 font-medium">
                    🎉 Goal reached!
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
