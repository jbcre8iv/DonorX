"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateGivingGoal(goalCents: number, year?: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (goalCents < 0) {
    return { error: "Goal must be a positive amount" };
  }

  const targetYear = year || new Date().getFullYear();

  // Upsert into giving_goals table
  const { error } = await supabase
    .from("giving_goals")
    .upsert(
      {
        user_id: user.id,
        year: targetYear,
        goal_cents: goalCents,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,year" }
    );

  if (error) {
    console.error("Update giving goal error:", error);
    return { error: "Failed to update giving goal. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
