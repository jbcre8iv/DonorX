// Email sending utility
// In production, integrate with a service like Resend, SendGrid, or AWS SES

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  // Check if we have email configuration
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    // In development without email configured, just log
    console.log("📧 Email would be sent (no RESEND_API_KEY configured):");
    console.log("  To:", payload.to);
    console.log("  Subject:", payload.subject);
    console.log("  ---");
    return { success: true, messageId: "dev-mode" };
  }

  try {
    // Using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "DonorX <noreply@donorx.org>",
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Email send failed:", error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Batch send emails (for notifications to multiple users)
export async function sendBatchEmails(
  payloads: EmailPayload[]
): Promise<SendEmailResult[]> {
  // Send emails in parallel with rate limiting
  const batchSize = 10;
  const results: SendEmailResult[] = [];

  for (let i = 0; i < payloads.length; i += batchSize) {
    const batch = payloads.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(sendEmail));
    results.push(...batchResults);

    // Small delay between batches to respect rate limits
    if (i + batchSize < payloads.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
