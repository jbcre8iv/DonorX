"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { getTeamInvitationEmail } from "@/lib/email/templates/team-invitation";

// Rate limiting: max invitations per organization per hour
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_HOURS = 1;

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
  const { data: profile } = await adminClient
    .from("users")
    .select("organization_id, role, first_name, last_name, email")
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

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email format" };
  }

  // Validate role
  if (!["admin", "member", "viewer"].includes(role)) {
    return { error: "Invalid role" };
  }

  // Rate limiting check
  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { count: recentInvites } = await adminClient
    .from("team_invitations")
    .select("id", { count: "exact" })
    .eq("organization_id", profile.organization_id)
    .gte("created_at", oneHourAgo);

  if (recentInvites && recentInvites >= RATE_LIMIT_MAX) {
    return { error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} invitations per hour.` };
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

  // Get organization name
  const { data: org } = await adminClient
    .from("organizations")
    .select("name")
    .eq("id", profile.organization_id)
    .single();

  // Create the invitation
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const { data: invitation, error: inviteError } = await adminClient
    .from("team_invitations")
    .insert({
      organization_id: profile.organization_id,
      email,
      role,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select("token")
    .single();

  if (inviteError || !invitation) {
    console.error("Error creating invitation:", inviteError);
    return { error: "Failed to create invitation" };
  }

  // Build secure invitation link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://donor-x.vercel.app";
  const inviteLink = `${baseUrl}/invite/${invitation.token}`;

  // Send invitation email
  const inviterName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.email;

  const emailContent = getTeamInvitationEmail({
    inviteeName: "", // We don't know their name yet
    organizationName: org?.name || "the organization",
    inviterName,
    role,
    inviteLink,
    expiresAt,
  });

  // Only send email if Resend API key is configured
  if (process.env.RESEND_API_KEY) {
    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error);
      // Don't fail the invitation, just log the error
      // The invitation is still valid and can be shared manually
    }
  } else {
    console.log("RESEND_API_KEY not configured. Invitation created but email not sent.");
    console.log("Invitation link:", inviteLink);
  }

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
