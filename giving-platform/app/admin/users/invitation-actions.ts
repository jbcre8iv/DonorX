"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/permissions";
import {
  generateInviteToken,
  hashToken,
  isValidTokenFormat,
  getExpirationDate,
  buildSecureInviteUrl,
} from "@/lib/auth/invitations";
import { Resend } from "resend";
import { headers } from "next/headers";

// Initialize Resend for email sending
const resend = new Resend(process.env.RESEND_API_KEY);

type InviteRole = "admin" | "member" | "viewer";

interface SendInvitationResult {
  success?: boolean;
  error?: string;
  invitationId?: string;
}

/**
 * Send a secure team invitation email
 * Only owners can send invitations
 */
export async function sendTeamInvitation(
  email: string,
  role: InviteRole
): Promise<SendInvitationResult> {
  // Verify caller is owner
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email address" };
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const adminClient = createAdminClient();

    // Check if email already has an active invitation
    const { data: existingInvite } = await adminClient
      .from("team_invitations")
      .select("id, status, expires_at")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvite) {
      return { error: "An active invitation already exists for this email" };
    }

    // Check if user already exists as team member
    const { data: existingUser } = await adminClient
      .from("users")
      .select("id, email, role")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser && existingUser.role && ["owner", "admin", "member", "viewer"].includes(existingUser.role)) {
      return { error: "This email is already registered as a team member" };
    }

    // Rate limiting: Check invitations sent in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await adminClient
      .from("team_invitations")
      .select("*", { count: "exact", head: true })
      .eq("invited_by", ownerCheck.user.id)
      .gte("created_at", oneHourAgo);

    if ((recentCount || 0) >= 20) {
      return { error: "Rate limit exceeded. Please wait before sending more invitations." };
    }

    // Generate secure token
    const { token, hash } = generateInviteToken();
    const expiresAt = getExpirationDate(7); // 7 days

    // Get client IP for audit
    const headersList = await headers();
    const clientIp = headersList.get("x-forwarded-for")?.split(",")[0] ||
                     headersList.get("x-real-ip") ||
                     "unknown";

    // Store invitation with hashed token
    const { data: invitation, error: insertError } = await adminClient
      .from("team_invitations")
      .insert({
        email: normalizedEmail,
        role,
        token_hash: hash,
        expires_at: expiresAt.toISOString(),
        invited_by: ownerCheck.user.id,
        created_from_ip: clientIp,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[sendTeamInvitation] Insert error:", insertError);
      return { error: "Failed to create invitation" };
    }

    // Build secure invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://donor-x.vercel.app";
    const inviteUrl = buildSecureInviteUrl(baseUrl, token);

    // Get inviter name for email
    const { data: inviterProfile } = await adminClient
      .from("users")
      .select("first_name, last_name")
      .eq("id", ownerCheck.user.id)
      .single();

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name} ${inviterProfile.last_name}`.trim()
      : "The DonorX team";

    // Send invitation email with secure HTML
    const { error: emailError } = await resend.emails.send({
      from: "DonorX <noreply@donor-x.vercel.app>",
      to: normalizedEmail,
      subject: "You've been invited to join the DonorX team",
      html: generateInvitationEmailHtml({
        inviterName,
        role,
        inviteUrl,
        expiresAt,
      }),
      text: generateInvitationEmailText({
        inviterName,
        role,
        inviteUrl,
        expiresAt,
      }),
    });

    if (emailError) {
      console.error("[sendTeamInvitation] Email error:", emailError);
      // Still return success - invitation exists, email just failed
      // Owner can resend or share link manually
      return {
        success: true,
        invitationId: invitation.id,
        error: "Invitation created but email delivery failed. You can copy the link manually."
      };
    }

    revalidatePath("/admin/users");
    return { success: true, invitationId: invitation.id };
  } catch (error) {
    console.error("[sendTeamInvitation] Error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Revoke a pending invitation
 */
export async function revokeInvitation(invitationId: string): Promise<{ success?: boolean; error?: string }> {
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  try {
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("team_invitations")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        revoked_by: ownerCheck.user.id,
      })
      .eq("id", invitationId)
      .eq("status", "pending");

    if (error) {
      console.error("[revokeInvitation] Error:", error);
      return { error: "Failed to revoke invitation" };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[revokeInvitation] Error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Resend an invitation email
 */
export async function resendInvitation(invitationId: string): Promise<SendInvitationResult> {
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  try {
    const adminClient = createAdminClient();

    // Get existing invitation
    const { data: invitation, error: fetchError } = await adminClient
      .from("team_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("status", "pending")
      .single();

    if (fetchError || !invitation) {
      return { error: "Invitation not found or already used" };
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return { error: "This invitation has expired. Please create a new one." };
    }

    // Generate new token (invalidates old one)
    const { token, hash } = generateInviteToken();
    const expiresAt = getExpirationDate(7);

    // Update invitation with new token
    const { error: updateError } = await adminClient
      .from("team_invitations")
      .update({
        token_hash: hash,
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", invitationId);

    if (updateError) {
      return { error: "Failed to regenerate invitation" };
    }

    // Send new email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://donor-x.vercel.app";
    const inviteUrl = buildSecureInviteUrl(baseUrl, token);

    const { data: inviterProfile } = await adminClient
      .from("users")
      .select("first_name, last_name")
      .eq("id", ownerCheck.user.id)
      .single();

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name} ${inviterProfile.last_name}`.trim()
      : "The DonorX team";

    await resend.emails.send({
      from: "DonorX <noreply@donor-x.vercel.app>",
      to: invitation.email,
      subject: "Reminder: You've been invited to join the DonorX team",
      html: generateInvitationEmailHtml({
        inviterName,
        role: invitation.role,
        inviteUrl,
        expiresAt,
        isReminder: true,
      }),
      text: generateInvitationEmailText({
        inviterName,
        role: invitation.role,
        inviteUrl,
        expiresAt,
        isReminder: true,
      }),
    });

    revalidatePath("/admin/users");
    return { success: true, invitationId };
  } catch (error) {
    console.error("[resendInvitation] Error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Validate and accept an invitation token
 * Called from the invite acceptance page
 */
export async function validateInvitationToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  role?: string;
  error?: string;
}> {
  // Validate token format first (prevents timing attacks)
  if (!isValidTokenFormat(token)) {
    return { valid: false, error: "Invalid invitation link" };
  }

  const tokenHash = hashToken(token);

  try {
    const adminClient = createAdminClient();

    const { data: invitation, error } = await adminClient
      .from("team_invitations")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("status", "pending")
      .single();

    if (error || !invitation) {
      return { valid: false, error: "Invalid or expired invitation" };
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await adminClient
        .from("team_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return { valid: false, error: "This invitation has expired" };
    }

    // Check use count
    if (invitation.use_count >= invitation.max_uses) {
      return { valid: false, error: "This invitation has already been used" };
    }

    return {
      valid: true,
      email: invitation.email,
      role: invitation.role,
    };
  } catch (error) {
    console.error("[validateInvitationToken] Error:", error);
    return { valid: false, error: "Failed to validate invitation" };
  }
}

/**
 * Accept an invitation and create team member account
 */
export async function acceptInvitation(
  token: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ success?: boolean; error?: string }> {
  // Validate token format
  if (!isValidTokenFormat(token)) {
    return { error: "Invalid invitation link" };
  }

  // Validate password
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const tokenHash = hashToken(token);

  try {
    const adminClient = createAdminClient();

    // Get and validate invitation
    const { data: invitation, error: fetchError } = await adminClient
      .from("team_invitations")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("status", "pending")
      .single();

    if (fetchError || !invitation) {
      return { error: "Invalid or expired invitation" };
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return { error: "This invitation has expired" };
    }

    if (invitation.use_count >= invitation.max_uses) {
      return { error: "This invitation has already been used" };
    }

    // Get client IP for audit
    const headersList = await headers();
    const clientIp = headersList.get("x-forwarded-for")?.split(",")[0] ||
                     headersList.get("x-real-ip") ||
                     "unknown";

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true, // Auto-confirm since we validated via invitation
      user_metadata: {
        full_name: `${firstName} ${lastName}`.trim(),
      },
    });

    if (authError) {
      console.error("[acceptInvitation] Auth error:", authError);
      if (authError.message.includes("already registered")) {
        return { error: "An account with this email already exists" };
      }
      return { error: "Failed to create account" };
    }

    if (!authData.user) {
      return { error: "Failed to create account" };
    }

    // Create user profile with assigned role (already approved)
    const { error: profileError } = await adminClient.from("users").insert({
      id: authData.user.id,
      email: invitation.email,
      first_name: firstName,
      last_name: lastName,
      role: invitation.role,
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: invitation.invited_by,
    });

    if (profileError) {
      console.error("[acceptInvitation] Profile error:", profileError);
      // Try to clean up auth user
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { error: "Failed to create profile" };
    }

    // Mark invitation as accepted
    await adminClient
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by: authData.user.id,
        accepted_from_ip: clientIp,
        use_count: invitation.use_count + 1,
      })
      .eq("id", invitation.id);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[acceptInvitation] Error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get pending invitations for display
 */
export async function getPendingInvitations() {
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error, invitations: [] };
  }

  try {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("team_invitations")
      .select(`
        id,
        email,
        role,
        created_at,
        expires_at,
        invited_by,
        inviter:users!team_invitations_invited_by_fkey(first_name, last_name)
      `)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getPendingInvitations] Error:", error);
      return { error: "Failed to fetch invitations", invitations: [] };
    }

    return { invitations: data || [] };
  } catch (error) {
    console.error("[getPendingInvitations] Error:", error);
    return { error: "An unexpected error occurred", invitations: [] };
  }
}

// Email template generators
interface EmailTemplateParams {
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
  isReminder?: boolean;
}

function generateInvitationEmailHtml(params: EmailTemplateParams): string {
  const { inviterName, role, inviteUrl, expiresAt, isReminder } = params;
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
  const expiresFormatted = expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isReminder ? "Reminder: " : ""}Join DonorX Team</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">
      ${isReminder ? "Reminder: " : ""}You're Invited to Join DonorX
    </h1>
  </div>

  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 24px;">
      <strong>${inviterName}</strong> has invited you to join the DonorX platform team as a <strong>${roleDisplay}</strong>.
    </p>

    <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
      DonorX is a platform that connects donors with verified nonprofits. As a team member, you'll help manage the platform and support our mission.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⏰ This invitation expires on ${expiresFormatted}</strong>
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

    <div style="font-size: 12px; color: #94a3b8;">
      <p style="margin-bottom: 8px;">
        <strong>Security Notice:</strong> This invitation was sent only to you. Do not forward this email or share the link with anyone else.
      </p>
      <p style="margin-bottom: 8px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
      <p style="margin: 0;">
        Button not working? Copy and paste this link into your browser:<br>
        <span style="word-break: break-all; color: #64748b;">${inviteUrl}</span>
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">© ${new Date().getFullYear()} DonorX. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

function generateInvitationEmailText(params: EmailTemplateParams): string {
  const { inviterName, role, inviteUrl, expiresAt, isReminder } = params;
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
  const expiresFormatted = expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
${isReminder ? "REMINDER: " : ""}You're Invited to Join DonorX

${inviterName} has invited you to join the DonorX platform team as a ${roleDisplay}.

DonorX is a platform that connects donors with verified nonprofits. As a team member, you'll help manage the platform and support our mission.

Accept your invitation by visiting:
${inviteUrl}

⏰ This invitation expires on ${expiresFormatted}

---

SECURITY NOTICE: This invitation was sent only to you. Do not forward this email or share the link with anyone else.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} DonorX. All rights reserved.
  `.trim();
}
