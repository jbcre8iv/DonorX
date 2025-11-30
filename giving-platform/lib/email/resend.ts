import { Resend } from "resend";

// Initialize Resend client
// Will throw error at runtime if API key is not set
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender - update when you verify your domain
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || "DonorX <onboarding@resend.dev>";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, from = DEFAULT_FROM, replyTo } = options;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export { resend };
