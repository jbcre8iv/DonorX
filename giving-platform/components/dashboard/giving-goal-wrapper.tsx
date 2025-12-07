"use client";

import { useTransition } from "react";
import { GivingGoalWidget } from "./giving-goal-widget";
import { updateGivingGoal } from "@/app/dashboard/actions";

interface GoalHistory {
  year: number;
  goal_cents: number;
  donated_cents: number;
}

interface GivingGoalWrapperProps {
  currentAmount: number;
  goalAmount: number;
  year: number;
  allGoals: GoalHistory[];
}

export function GivingGoalWrapper({
  currentAmount,
  goalAmount,
  year,
  allGoals,
}: GivingGoalWrapperProps) {
  const [isPending, startTransition] = useTransition();

  const handleGoalChange = (newGoalCents: number) => {
    startTransition(async () => {
      const result = await updateGivingGoal(newGoalCents);
      if (result.error) {
        console.error("Failed to update goal:", result.error);
      }
    });
  };

  return (
    <GivingGoalWidget
      currentAmount={currentAmount}
      goalAmount={goalAmount}
      year={year}
      onGoalChange={handleGoalChange}
      allGoals={allGoals}
    />
  );
}
