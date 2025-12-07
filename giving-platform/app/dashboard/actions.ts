"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateGivingGoal(goalCents: number) {
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

  const { error } = await supabase
    .from("users")
    .update({ giving_goal_cents: goalCents })
    .eq("id", user.id);

  if (error) {
    console.error("Update giving goal error:", error);
    return { error: "Failed to update giving goal. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
