"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function acceptInvitation(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the invitation
  const { data: invitation, error: fetchError } = await supabase
    .from("nonprofit_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (fetchError || !invitation) {
    return { success: false, error: "Invitation not found" };
  }

  // Check if already accepted
  if (invitation.accepted_at) {
    return { success: false, error: "Invitation already accepted" };
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    return { success: false, error: "Invitation has expired" };
  }

  // Check if user is already a member of this nonprofit
  const { data: existingMember } = await supabase
    .from("nonprofit_users")
    .select("id")
    .eq("nonprofit_id", invitation.nonprofit_id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    return { success: false, error: "You are already a member of this nonprofit" };
  }

  // Create the nonprofit_user record
  const { error: insertError } = await adminSupabase
    .from("nonprofit_users")
    .insert({
      nonprofit_id: invitation.nonprofit_id,
      user_id: user.id,
      role: invitation.role,
      invited_by: invitation.invited_by,
    });

  if (insertError) {
    console.error("Failed to create nonprofit user:", insertError);
    return { success: false, error: "Failed to accept invitation" };
  }

  // Mark invitation as accepted
  await adminSupabase
    .from("nonprofit_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  revalidatePath("/nonprofit");

  return { success: true };
}

export async function acceptInvitationWithNewAccount(
  token: string,
  email: string,
  password: string,
  fullName?: string
): Promise<{
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
}> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get the invitation first
  const { data: invitation, error: fetchError } = await supabase
    .from("nonprofit_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (fetchError || !invitation) {
    return { success: false, error: "Invitation not found" };
  }

  // Check if already accepted
  if (invitation.accepted_at) {
    return { success: false, error: "Invitation already accepted" };
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    return { success: false, error: "Invitation has expired" };
  }

  // Try to sign up or sign in the user
  let userId: string;

  // First try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (signUpError) {
    // If user already exists, try to sign in
    if (signUpError.message.includes("already registered") ||
        signUpError.message.includes("already exists")) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return { success: false, error: "Invalid email or password" };
      }

      userId = signInData.user.id;
    } else {
      return { success: false, error: signUpError.message };
    }
  } else if (signUpData.user) {
    userId = signUpData.user.id;

    // Check if email confirmation is required
    if (!signUpData.session) {
      // Email confirmation required
      // We can't create the nonprofit_user yet because the user isn't confirmed
      // Store the intent in the invitation metadata or handle on email confirmation

      // For now, we'll create the record using admin client
      // The user will be able to access it once they confirm their email
    }
  } else {
    return { success: false, error: "Failed to create account" };
  }

  // Create the users table entry if it doesn't exist
  const { data: existingUser } = await adminSupabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existingUser) {
    await adminSupabase.from("users").insert({
      id: userId,
      email,
      full_name: fullName || null,
      role: "member",
    });
  }

  // Check if user is already a member of this nonprofit
  const { data: existingMember } = await adminSupabase
    .from("nonprofit_users")
    .select("id")
    .eq("nonprofit_id", invitation.nonprofit_id)
    .eq("user_id", userId)
    .single();

  if (existingMember) {
    return { success: false, error: "You are already a member of this nonprofit" };
  }

  // Create the nonprofit_user record
  const { error: insertError } = await adminSupabase
    .from("nonprofit_users")
    .insert({
      nonprofit_id: invitation.nonprofit_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
    });

  if (insertError) {
    console.error("Failed to create nonprofit user:", insertError);
    return { success: false, error: "Failed to accept invitation" };
  }

  // Mark invitation as accepted
  await adminSupabase
    .from("nonprofit_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  revalidatePath("/nonprofit");

  // Return whether email confirmation is needed
  const needsEmailConfirmation = !signUpData?.session;

  return { success: true, needsEmailConfirmation };
}
