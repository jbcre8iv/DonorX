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

export async function toggleSimulationMode(): Promise<{ success: boolean; enabled: boolean; error?: string }> {
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

  return { success: true, enabled: newEnabled };
}
