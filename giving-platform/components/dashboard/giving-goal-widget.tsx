"use client";

import { useState, useEffect } from "react";
import { Target, Edit2, Check, X, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/modal";

interface GoalHistory {
  year: number;
  goal_cents: number;
  donated_cents: number;
}

interface GivingGoalWidgetProps {
  currentAmount: number;
  goalAmount: number;
  year: number;
  onGoalChange?: (newGoal: number) => void;
  allGoals?: GoalHistory[];
}

export function GivingGoalWidget({
  currentAmount,
  goalAmount,
  year,
  onGoalChange,
  allGoals = [],
}: GivingGoalWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // Filter out current year from history and get only past years
  const pastGoals = allGoals.filter((g) => g.year < year);

  const percentage = goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0;
  const displayPercentage = Math.min(percentage, 100); // Cap ring at 100% for visual
  const remaining = Math.max(goalAmount - currentAmount, 0);

  // Animate the progress ring
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(displayPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [displayPercentage]);

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
                setEditValue((goalAmount / 100).toLocaleString());
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
                <span className={`font-bold text-slate-900 ${percentage >= 1000 ? "text-sm" : percentage >= 100 ? "text-base" : "text-lg"}`}>
                  {Math.round(percentage).toLocaleString()}%
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
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, "");
                    const formatted = rawValue ? parseInt(rawValue, 10).toLocaleString() : "";
                    setEditValue(formatted);
                  }}
                  className="w-28 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {formatCurrency(goalAmount / 100)}
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
                    {formatCurrency(remaining / 100)} to go
                  </div>
                ) : (
                  <div className="text-sm text-emerald-600 font-medium">
                    Goal reached!
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* View Past Goals Button */}
        {pastGoals.length > 0 && (
          <button
            onClick={() => setShowHistory(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
          >
            <History className="h-4 w-4" />
            View Past Goals
          </button>
        )}
      </CardContent>

      {/* Past Goals History Modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)}>
        <ModalHeader>
          <h2 className="text-lg font-semibold text-slate-900">Giving Goal History</h2>
          <p className="text-sm text-slate-500 mt-1">
            Your past giving goals and achievements
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            {pastGoals.map((goal) => {
              const goalPercentage = goal.goal_cents > 0
                ? Math.round((goal.donated_cents / goal.goal_cents) * 100)
                : 0;
              const achieved = goal.donated_cents >= goal.goal_cents;

              return (
                <div
                  key={goal.year}
                  className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg"
                >
                  {/* Goal details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{goal.year}</span>
                      <span className={`text-sm font-medium ${achieved ? "text-emerald-600" : "text-slate-500"}`}>
                        {goalPercentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1 text-sm">
                      <span className="text-slate-600">
                        Goal: {formatCurrency(goal.goal_cents / 100)}
                      </span>
                      <span className={achieved ? "text-emerald-600" : "text-slate-500"}>
                        Donated: {formatCurrency(goal.donated_cents / 100)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${achieved ? "bg-emerald-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(goalPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {pastGoals.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No past goals yet. Your goal history will appear here after this year.
              </div>
            )}
          </div>
        </ModalBody>
      </Modal>
    </Card>
  );
}
