"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function addBetaTester(formData: FormData) {
  const supabase = await createClient();

  // Check if user is admin/owner
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || !["owner", "admin"].includes(userData.role || "")) {
    return { error: "Not authorized" };
  }

  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const name = (formData.get("name") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!email) {
    return { error: "Email is required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email format" };
  }

  const adminClient = createAdminClient();

  // Check if email already exists
  const { data: existing } = await adminClient
    .from("beta_testers")
    .select("id, is_active")
    .eq("email", email)
    .single();

  if (existing) {
    if (existing.is_active) {
      return { error: "This email already has beta access" };
    } else {
      // Reactivate existing entry
      const { error } = await adminClient
        .from("beta_testers")
        .update({ is_active: true, name, notes })
        .eq("id", existing.id);

      if (error) {
        return { error: `Failed to reactivate: ${error.message}` };
      }

      revalidatePath("/admin/beta-testers");
      return { success: true, message: "Beta access reactivated" };
    }
  }

  const { error } = await adminClient.from("beta_testers").insert({
    email,
    name,
    notes,
    added_by: user.id,
    is_active: true,
  });

  if (error) {
    return { error: `Failed to add beta tester: ${error.message}` };
  }

  revalidatePath("/admin/beta-testers");
  return { success: true };
}

export async function revokeBetaAccess(testerId: string) {
  const supabase = await createClient();

  // Check if user is admin/owner
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || !["owner", "admin"].includes(userData.role || "")) {
    return { error: "Not authorized" };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("beta_testers")
    .update({ is_active: false })
    .eq("id", testerId);

  if (error) {
    return { error: `Failed to revoke access: ${error.message}` };
  }

  revalidatePath("/admin/beta-testers");
  return { success: true };
}

export async function restoreBetaAccess(testerId: string) {
  const supabase = await createClient();

  // Check if user is admin/owner
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || !["owner", "admin"].includes(userData.role || "")) {
    return { error: "Not authorized" };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("beta_testers")
    .update({ is_active: true })
    .eq("id", testerId);

  if (error) {
    return { error: `Failed to restore access: ${error.message}` };
  }

  revalidatePath("/admin/beta-testers");
  return { success: true };
}

export async function deleteBetaTester(testerId: string) {
  const supabase = await createClient();

  // Check if user is admin/owner
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || !["owner", "admin"].includes(userData.role || "")) {
    return { error: "Not authorized" };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("beta_testers")
    .delete()
    .eq("id", testerId);

  if (error) {
    return { error: `Failed to delete: ${error.message}` };
  }

  revalidatePath("/admin/beta-testers");
  return { success: true };
}
