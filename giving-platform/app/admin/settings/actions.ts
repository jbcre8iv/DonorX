"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function getSimulationMode(): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("system_settings")
      .select("value")
      .eq("key", "simulation_mode")
      .single();

    if (error || !data) {
      return false;
    }

    return data.value?.enabled === true;
  } catch {
    return false;
  }
}

async function clearSimulatedData(): Promise<{ deletedCount: number }> {
  const adminClient = createAdminClient();

  // Delete all simulated donations (allocations will cascade delete)
  const { data: deletedDonations, error } = await adminClient
    .from("donations")
    .delete()
    .eq("is_simulated", true)
    .select("id");

  if (error) {
    console.error("Failed to clear simulated data:", error);
    return { deletedCount: 0 };
  }

  return { deletedCount: deletedDonations?.length || 0 };
}

export async function toggleSimulationMode(): Promise<{ success: boolean; enabled: boolean; error?: string; deletedCount?: number }> {
  const supabase = await createClient();

  // Check if user is admin/owner
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, enabled: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  const { data: userData } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || !["owner", "admin"].includes(userData.role)) {
    return { success: false, enabled: false, error: "Unauthorized" };
  }

  // Get current state
  const { data: currentSetting } = await adminClient
    .from("system_settings")
    .select("value")
    .eq("key", "simulation_mode")
    .single();

  const currentEnabled = currentSetting?.value?.enabled === true;
  const newEnabled = !currentEnabled;

  // If turning OFF simulation mode, clear all simulated data
  let deletedCount = 0;
  if (currentEnabled && !newEnabled) {
    const result = await clearSimulatedData();
    deletedCount = result.deletedCount;
    console.log(`Simulation mode disabled: Cleared ${deletedCount} simulated donation(s)`);
  }

  // Update or insert the setting
  const { error } = await adminClient
    .from("system_settings")
    .upsert({
      key: "simulation_mode",
      value: { enabled: newEnabled },
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });

  if (error) {
    console.error("Failed to toggle simulation mode:", error);
    return { success: false, enabled: currentEnabled, error: "Failed to update setting" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/donate");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/receipts");
  revalidatePath("/dashboard/history");

  return { success: true, enabled: newEnabled, deletedCount };
}
