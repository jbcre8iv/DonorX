import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "./send";
import {
  getDonationConfirmationEmail,
  getImpactReportNotificationEmail,
  getReceiptReadyEmail,
} from "./templates";

// Send donation confirmation email
export async function sendDonationConfirmation(donationId: string) {
  const supabase = await createClient();

  // Get donation with user and allocations
  const { data: donation } = await supabase
    .from("donations")
    .select(`
      id,
      amount_cents,
      is_recurring,
      recurring_interval,
      user:users(email, full_name),
      allocations(
        percentage,
        amount_cents,
        nonprofit:nonprofits(name),
        category:categories(name)
      )
    `)
    .eq("id", donationId)
    .single();

  if (!donation) {
    console.error("Donation not found:", donationId);
    return { success: false, error: "Donation not found" };
  }

  const user = Array.isArray(donation.user) ? donation.user[0] : donation.user;
  if (!user?.email) {
    console.error("User email not found for donation:", donationId);
    return { success: false, error: "User email not found" };
  }

  const allocations = ((donation.allocations as Array<Record<string, unknown>>) || []).map((a) => {
    const nonprofit = Array.isArray(a.nonprofit) ? a.nonprofit[0] : a.nonprofit;
    const category = Array.isArray(a.category) ? a.category[0] : a.category;
    return {
      name: (nonprofit?.name || category?.name || "Unknown") as string,
      percentage: a.percentage as number,
      amount: a.amount_cents as number,
    };
  });

  const emailData = getDonationConfirmationEmail({
    donorName: user.full_name || "Valued Donor",
    amount: donation.amount_cents,
    isRecurring: donation.is_recurring || false,
    frequency: donation.recurring_interval || undefined,
    allocations,
    donationId: donation.id,
  });

  return sendEmail({
    to: user.email,
    ...emailData,
  });
}

// Send impact report notification to all donors of a nonprofit
export async function sendImpactReportNotification(reportId: string) {
  const supabase = await createClient();

  // Get the impact report with nonprofit info
  const { data: report } = await supabase
    .from("impact_reports")
    .select(`
      id,
      title,
      content,
      nonprofit:nonprofits(id, name)
    `)
    .eq("id", reportId)
    .single();

  if (!report) {
    console.error("Impact report not found:", reportId);
    return { success: false, error: "Report not found" };
  }

  const nonprofit = Array.isArray(report.nonprofit) ? report.nonprofit[0] : report.nonprofit;
  if (!nonprofit) {
    return { success: false, error: "Nonprofit not found" };
  }

  // Get all users who have donated to this nonprofit
  const { data: donors } = await supabase
    .from("allocations")
    .select(`
      donation:donations!inner(
        user:users(id, email, full_name)
      )
    `)
    .eq("nonprofit_id", nonprofit.id)
    .eq("donation.status", "completed");

  if (!donors || donors.length === 0) {
    return { success: true, message: "No donors to notify" };
  }

  // Get unique users
  const uniqueUsers = new Map<string, { email: string; name: string }>();
  donors.forEach((d: Record<string, unknown>) => {
    const donation = Array.isArray(d.donation) ? d.donation[0] : d.donation;
    const user = donation?.user;
    const userData = Array.isArray(user) ? user[0] : user;
    if (userData?.email && userData?.id) {
      uniqueUsers.set(userData.id, {
        email: userData.email,
        name: userData.full_name || "Valued Donor",
      });
    }
  });

  // Send emails to all donors
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const results = await Promise.all(
    Array.from(uniqueUsers.values()).map((user) => {
      const emailData = getImpactReportNotificationEmail({
        donorName: user.name,
        nonprofitName: nonprofit.name,
        reportTitle: report.title,
        reportSummary: report.content?.slice(0, 200) + "..." || "View the full report for details.",
        reportUrl: `${baseUrl}/dashboard/impact`,
      });

      return sendEmail({
        to: user.email,
        ...emailData,
      });
    })
  );

  const successCount = results.filter((r) => r.success).length;
  return {
    success: true,
    message: `Sent to ${successCount} of ${uniqueUsers.size} donors`,
  };
}

// Send annual receipt ready notification
export async function sendReceiptReadyNotification(
  userId: string,
  year: number,
  totalAmount: number,
  downloadUrl: string
) {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (!user?.email) {
    return { success: false, error: "User not found" };
  }

  const emailData = getReceiptReadyEmail({
    donorName: user.full_name || "Valued Donor",
    year,
    totalAmount,
    downloadUrl,
  });

  return sendEmail({
    to: user.email,
    ...emailData,
  });
}
