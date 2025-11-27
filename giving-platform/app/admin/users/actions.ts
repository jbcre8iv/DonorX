"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/permissions";

type UserRole = "owner" | "admin" | "member" | "viewer";
type UserStatus = "pending" | "approved" | "rejected";

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

/**
 * Approve a pending user - only owners can approve users
 */
export async function approveUser(userId: string) {
  // Only owners can approve users
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("users")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: ownerCheck.user.id,
      })
      .eq("id", userId)
      .eq("status", "pending"); // Only approve pending users

    if (error) {
      console.error("[approveUser] Error:", error.message);
      return { error: "Failed to approve user" };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    console.error("[approveUser] Admin client error:", e);
    return { error: "Failed to approve user" };
  }
}

/**
 * Reject a pending user - only owners can reject users
 */
export async function rejectUser(userId: string) {
  // Only owners can reject users
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("users")
      .update({
        status: "rejected",
      })
      .eq("id", userId)
      .eq("status", "pending"); // Only reject pending users

    if (error) {
      console.error("[rejectUser] Error:", error.message);
      return { error: "Failed to reject user" };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    console.error("[rejectUser] Admin client error:", e);
    return { error: "Failed to reject user" };
  }
}

/**
 * Delete a rejected user - only owners can delete users
 * This removes both the user record and their auth account
 */
export async function deleteUser(userId: string) {
  // Only owners can delete users
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  // Prevent deleting yourself
  if (userId === ownerCheck.user.id) {
    return { error: "You cannot delete your own account" };
  }

  try {
    const adminClient = createAdminClient();

    // Check user status - only allow deleting rejected users or pending users
    const { data: user } = await adminClient
      .from("users")
      .select("status, role")
      .eq("id", userId)
      .single();

    if (!user) {
      return { error: "User not found" };
    }

    // Prevent deleting other owners
    if (user.role === "owner") {
      return { error: "Cannot delete owner accounts" };
    }

    // Only allow deleting rejected or pending users for safety
    if (user.status !== "rejected" && user.status !== "pending") {
      return { error: "Can only delete rejected or pending users" };
    }

    // Delete the user from our users table (will cascade from auth.users)
    const { error } = await adminClient
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("[deleteUser] Error:", error.message);
      return { error: "Failed to delete user" };
    }

    // Also delete from Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("[deleteUser] Auth deletion error:", authError.message);
      // User record is already deleted, auth deletion failed but that's okay
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    console.error("[deleteUser] Admin client error:", e);
    return { error: "Failed to delete user" };
  }
}
