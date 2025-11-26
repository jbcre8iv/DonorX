"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendImpactReportNotification } from "@/lib/email/notifications";

export async function createImpactReport(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const nonprofitId = formData.get("nonprofit_id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const fundsUsed = formData.get("funds_used") as string;
  const peopleServed = formData.get("people_served") as string;
  const reportDate = formData.get("report_date") as string;

  if (!nonprofitId || !title) {
    return { error: "Nonprofit and title are required" };
  }

  const { data: report, error } = await supabase
    .from("impact_reports")
    .insert({
      nonprofit_id: nonprofitId,
      title,
      content: content || null,
      funds_used_cents: fundsUsed ? Math.round(parseFloat(fundsUsed) * 100) : null,
      people_served: peopleServed ? parseInt(peopleServed, 10) : null,
      report_date: reportDate || null,
      media_urls: null, // Would handle file uploads separately
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create impact report:", error);
    return { error: error.message };
  }

  // Send notification emails to donors (async, don't block)
  sendImpactReportNotification(report.id).catch(console.error);

  revalidatePath("/nonprofit/reports");
  revalidatePath("/dashboard/impact");

  return { success: true, reportId: report.id };
}

export async function deleteImpactReport(reportId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("impact_reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/nonprofit/reports");
  revalidatePath("/dashboard/impact");

  return { success: true };
}
