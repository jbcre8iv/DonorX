"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Get the current user's simulation mode status
 * Returns true if the user has simulation enabled for themselves
 */
export async function getSimulationMode(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("users")
      .select("simulation_enabled")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return false;
    }

    return data.simulation_enabled === true;
  } catch {
    return false;
  }
}

/**
 * Toggle simulation mode for the current user
 * Each user has their own simulation on/off state
 */
export async function toggleSimulationMode(): Promise<{ success: boolean; enabled: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, enabled: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Get current user data including simulation access
  const { data: userData } = await adminClient
    .from("users")
    .select("role, simulation_access, simulation_enabled")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return { success: false, enabled: false, error: "User not found" };
  }

  // Check if user has simulation access (admin/owner automatically have it, others need explicit access)
  const isAdminOrOwner = ["owner", "admin"].includes(userData.role);
  const hasAccess = isAdminOrOwner || userData.simulation_access === true;

  if (!hasAccess) {
    return { success: false, enabled: false, error: "No simulation access" };
  }

  // Toggle the user's personal simulation state
  const currentEnabled = userData.simulation_enabled === true;
  const newEnabled = !currentEnabled;

  const { error } = await adminClient
    .from("users")
    .update({ simulation_enabled: newEnabled })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to toggle simulation mode:", error);
    return { success: false, enabled: currentEnabled, error: "Failed to update setting" };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/donate");
  revalidatePath("/dashboard");

  return { success: true, enabled: newEnabled };
}
