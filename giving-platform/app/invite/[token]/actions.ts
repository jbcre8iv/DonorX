"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to accept an invitation" };
  }

  // Get the invitation
  const { data: invitation, error: fetchError } = await adminClient
    .from("team_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (fetchError || !invitation) {
    return { error: "Invalid invitation" };
  }

  // Validate invitation status
  if (invitation.status !== "pending") {
    return { error: "This invitation is no longer valid" };
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await adminClient
      .from("team_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    return { error: "This invitation has expired" };
  }

  // Verify email matches
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: "This invitation was sent to a different email address" };
  }

  // Check if user already exists in users table
  const { data: existingUser } = await adminClient
    .from("users")
    .select("id, organization_id")
    .eq("id", user.id)
    .single();

  if (existingUser?.organization_id === invitation.organization_id) {
    // Already a member, just mark invitation as accepted
    await adminClient
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    return { success: true };
  }

  // Start transaction-like operations
  try {
    if (existingUser) {
      // Update existing user's organization
      const { error: updateError } = await adminClient
        .from("users")
        .update({
          organization_id: invitation.organization_id,
          role: invitation.role,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating user:", updateError);
        return { error: "Failed to join organization" };
      }
    } else {
      // Create new user profile
      const { error: createError } = await adminClient
        .from("users")
        .insert({
          id: user.id,
          email: user.email!,
          organization_id: invitation.organization_id,
          role: invitation.role,
          status: "approved",
          approved_at: new Date().toISOString(),
        });

      if (createError) {
        console.error("Error creating user:", createError);
        return { error: "Failed to create user profile" };
      }
    }

    // Mark invitation as accepted
    const { error: acceptError } = await adminClient
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    if (acceptError) {
      console.error("Error marking invitation as accepted:", acceptError);
      // Don't fail - user is already added to org
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings/team");

    return { success: true };
  } catch (err) {
    console.error("Error accepting invitation:", err);
    return { error: "An unexpected error occurred" };
  }
}
