"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type UserRole = "owner" | "admin" | "member" | "viewer";

export async function updateUserRole(userId: string, newRole: UserRole) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return { error: "Not authenticated" };
  }

  // Get current user's role
  let currentUserRole: string | null = null;
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("users")
      .select("role")
      .eq("id", currentUser.id)
      .single();
    currentUserRole = data?.role;
  } catch {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", currentUser.id)
      .single();
    currentUserRole = data?.role;
  }

  // Only owners can change roles
  if (currentUserRole !== "owner") {
    return { error: "Only owners can change user roles" };
  }

  // Prevent changing your own role
  if (userId === currentUser.id) {
    return { error: "You cannot change your own role" };
  }

  // Prevent creating new owners (there should only be one)
  if (newRole === "owner") {
    return { error: "Cannot assign owner role. Transfer ownership instead." };
  }

  // Update the role using admin client
  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("[updateUserRole] Error:", error.message);
      return { error: "Failed to update role" };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    console.error("[updateUserRole] Admin client error:", e);
    return { error: "Failed to update role" };
  }
}
