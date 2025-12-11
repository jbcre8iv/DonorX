"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireOwner, requireAdmin } from "@/lib/auth/permissions";

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
 * Promote a regular user to team member - owners and admins can promote
 * Admins can only promote to member/viewer, not admin
 */
export async function promoteToTeam(userId: string, role: "admin" | "member" | "viewer") {
  // Owners and admins can promote users
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) {
    return { error: adminCheck.error };
  }

  // Prevent promoting yourself
  if (userId === adminCheck.user.id) {
    return { error: "You cannot promote yourself" };
  }

  // Admins can only promote to member or viewer, not admin
  if (adminCheck.user.role === "admin" && role === "admin") {
    return { error: "Only owners can promote users to admin" };
  }

  try {
    const adminClient = createAdminClient();

    // Check user exists
    const { data: user } = await adminClient
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (!user) {
      return { error: "User not found" };
    }

    // Check if already a team member
    const teamRoles = ["owner", "admin", "member", "viewer"];
    if (user.role && teamRoles.includes(user.role)) {
      return { error: "User is already a team member" };
    }

    // Update the user's role
    const { error } = await adminClient
      .from("users")
      .update({
        role,
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: adminCheck.user.id,
      })
      .eq("id", userId);

    if (error) {
      console.error("[promoteToTeam] Error:", error.message);
      return { error: "Failed to promote user" };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    console.error("[promoteToTeam] Admin client error:", e);
    return { error: "Failed to promote user" };
  }
}

/**
 * Remove user from team (demote to regular user) - only owners can demote
 */
export async function removeFromTeam(userId: string) {
  // Only owners can demote users
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  // Prevent demoting yourself
  if (userId === ownerCheck.user.id) {
    return { error: "You cannot demote yourself" };
  }

  try {
    const adminClient = createAdminClient();

    // Check user exists and is not owner
    const { data: user } = await adminClient
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (!user) {
      return { error: "User not found" };
    }

    if (user.role === "owner") {
      return { error: "Cannot demote owner" };
    }

    // Remove team role (set to null)
    const { error } = await adminClient
      .from("users")
      .update({ role: null })
      .eq("id", userId);

    if (error) {
      console.error("[removeFromTeam] Error:", error.message);
      return { error: "Failed to remove from team" };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    console.error("[removeFromTeam] Admin client error:", e);
    return { error: "Failed to remove from team" };
  }
}

/**
 * Toggle simulation access for a user - only owners can toggle
 * When enabling access, also enables global simulation mode automatically
 */
export async function toggleSimulationAccess(userId: string, enabled: boolean) {
  // Only owners can toggle simulation access
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  try {
    const adminClient = createAdminClient();

    // Check user exists
    const { data: user } = await adminClient
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (!user) {
      return { error: "User not found" };
    }

    // Admins and owners automatically have simulation access, no need to toggle
    if (user.role === "admin" || user.role === "owner") {
      return { error: "Admins and owners automatically have simulation access" };
    }

    // Update simulation access and simulation_enabled together
    // When granting access: turn ON simulation for that user by default
    // When revoking access: turn OFF simulation to fully disable it
    const updateData = {
      simulation_access: enabled,
      simulation_enabled: enabled, // Always sync: enabled=true means ON, enabled=false means OFF
    };

    const { error } = await adminClient
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      console.error("[toggleSimulationAccess] Error:", error.message);
      return { error: "Failed to update simulation access" };
    }

    revalidatePath("/admin/users");
    revalidatePath("/");
    return { success: true, enabled };
  } catch (e) {
    console.error("[toggleSimulationAccess] Admin client error:", e);
    return { error: "Failed to update simulation access" };
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
