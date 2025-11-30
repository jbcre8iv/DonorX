interface TeamInvitationEmailProps {
  inviteeName: string;
  organizationName: string;
  inviterName: string;
  role: string;
  inviteLink: string;
  expiresAt: Date;
}

export function getTeamInvitationEmail(props: TeamInvitationEmailProps) {
  const { inviteeName, organizationName, inviterName, role, inviteLink, expiresAt } = props;

  const roleDescriptions: Record<string, string> = {
    admin: "manage team members, invite users, and access all features",
    member: "make donations, view history, and manage their profile",
    viewer: "view donations and reports (read-only access)",
  };

  const roleDescription = roleDescriptions[role] || roleDescriptions.member;
  const expiresDate = expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `You've been invited to join ${organizationName} on DonorX`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <div style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 20px; border-radius: 8px; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
                DonorX
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #0f172a;">
                You're invited to join ${organizationName}
              </h1>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;">
                Hi${inviteeName ? ` ${inviteeName}` : ""},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on DonorX as a <strong>${role}</strong>.
              </p>

              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #475569;">
                As a ${role}, you'll be able to ${roleDescription}.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" target="_blank" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; font-size: 14px; color: #64748b; text-align: center;">
                This invitation expires on ${expiresDate}
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Security Notice:</strong> If you didn't expect this invitation, you can safely ignore this email. Never share this link with others.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8; text-align: center;">
                This email was sent by DonorX on behalf of ${organizationName}.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8; text-align: center; word-break: break-all;">
                ${inviteLink}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
You've been invited to join ${organizationName} on DonorX

Hi${inviteeName ? ` ${inviteeName}` : ""},

${inviterName} has invited you to join ${organizationName} on DonorX as a ${role}.

As a ${role}, you'll be able to ${roleDescription}.

Accept your invitation here:
${inviteLink}

This invitation expires on ${expiresDate}.

Security Notice: If you didn't expect this invitation, you can safely ignore this email. Never share this link with others.

---
This email was sent by DonorX on behalf of ${organizationName}.
  `.trim();

  return { subject, html, text };
}
