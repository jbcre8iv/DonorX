"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get current user's profile and verify they're an admin/owner
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { error: "No organization found" };
  }

  if (!["owner", "admin"].includes(profile.role)) {
    return { error: "You don't have permission to invite team members" };
  }

  const email = formData.get("email") as string;
  const role = formData.get("role") as string;

  if (!email || !role) {
    return { error: "Email and role are required" };
  }

  // Check if user already exists in the organization
  const { data: existingUser } = await adminClient
    .from("users")
    .select("id")
    .eq("email", email)
    .eq("organization_id", profile.organization_id)
    .single();

  if (existingUser) {
    return { error: "This user is already a member of your organization" };
  }

  // Check for existing pending invitation
  const { data: existingInvite } = await adminClient
    .from("team_invitations")
    .select("id")
    .eq("email", email)
    .eq("organization_id", profile.organization_id)
    .eq("status", "pending")
    .single();

  if (existingInvite) {
    return { error: "An invitation has already been sent to this email" };
  }

  // Create the invitation
  const { error: inviteError } = await adminClient
    .from("team_invitations")
    .insert({
      organization_id: profile.organization_id,
      email,
      role,
      invited_by: user.id,
    });

  if (inviteError) {
    console.error("Error creating invitation:", inviteError);
    return { error: "Failed to create invitation" };
  }

  // TODO: Send invitation email via your email service
  // For now, we'll just create the invitation record

  revalidatePath("/dashboard/settings/team");
  return { success: true };
}

export async function cancelInvitation(invitationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get current user's profile and verify they're an admin/owner
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { error: "No organization found" };
  }

  if (!["owner", "admin"].includes(profile.role)) {
    return { error: "You don't have permission to cancel invitations" };
  }

  const { error } = await supabase
    .from("team_invitations")
    .update({ status: "canceled" })
    .eq("id", invitationId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    return { error: "Failed to cancel invitation" };
  }

  revalidatePath("/dashboard/settings/team");
  return { success: true };
}

export async function updateMemberRole(memberId: string, newRole: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get current user's profile
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { error: "No organization found" };
  }

  // Only owners can change roles, or admins can change non-owner roles
  if (profile.role === "owner") {
    // Owner can change any role
  } else if (profile.role === "admin") {
    // Admin cannot promote to owner or demote owners
    if (newRole === "owner") {
      return { error: "Only owners can assign the owner role" };
    }
    // Check if target is an owner
    const { data: targetUser } = await adminClient
      .from("users")
      .select("role")
      .eq("id", memberId)
      .single();

    if (targetUser?.role === "owner") {
      return { error: "Admins cannot modify owner accounts" };
    }
  } else {
    return { error: "You don't have permission to change roles" };
  }

  // Prevent demoting yourself if you're the only owner
  if (user.id === memberId && profile.role === "owner" && newRole !== "owner") {
    const { count } = await adminClient
      .from("users")
      .select("id", { count: "exact" })
      .eq("organization_id", profile.organization_id)
      .eq("role", "owner");

    if (count === 1) {
      return { error: "Cannot demote yourself. You're the only owner." };
    }
  }

  const { error } = await adminClient
    .from("users")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    return { error: "Failed to update role" };
  }

  revalidatePath("/dashboard/settings/team");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Prevent removing yourself
  if (user.id === memberId) {
    return { error: "You cannot remove yourself from the organization" };
  }

  // Get current user's profile
  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { error: "No organization found" };
  }

  if (!["owner", "admin"].includes(profile.role)) {
    return { error: "You don't have permission to remove team members" };
  }

  // Check if target is an owner (only owners can remove owners)
  const { data: targetUser } = await adminClient
    .from("users")
    .select("role")
    .eq("id", memberId)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!targetUser) {
    return { error: "User not found in your organization" };
  }

  if (targetUser.role === "owner" && profile.role !== "owner") {
    return { error: "Only owners can remove other owners" };
  }

  // Remove the user from the organization (set organization_id to null)
  const { error } = await adminClient
    .from("users")
    .update({ organization_id: null, role: "member" })
    .eq("id", memberId);

  if (error) {
    return { error: "Failed to remove team member" };
  }

  revalidatePath("/dashboard/settings/team");
  return { success: true };
}
