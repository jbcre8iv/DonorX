"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileFormData = {
  name: string;
  mission: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

export async function updateNonprofitProfile(
  nonprofitId: string,
  data: ProfileFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user has access to this nonprofit
  const { data: nonprofitUser } = await supabase
    .from("nonprofit_users")
    .select("role")
    .eq("nonprofit_id", nonprofitId)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser || !["admin", "editor"].includes(nonprofitUser.role)) {
    return { success: false, error: "Not authorized to edit this nonprofit" };
  }

  // Update the nonprofit
  const { error } = await supabase
    .from("nonprofits")
    .update({
      name: data.name,
      mission: data.mission,
      description: data.description,
      website: data.website,
      logo_url: data.logo_url,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      phone: data.phone,
      address_line1: data.address_line1,
      address_line2: data.address_line2,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      country: data.country,
    })
    .eq("id", nonprofitId);

  if (error) {
    console.error("Failed to update nonprofit:", error);
    return { success: false, error: "Failed to update profile" };
  }

  revalidatePath("/nonprofit");
  revalidatePath("/nonprofit/profile");
  revalidatePath(`/directory/${nonprofitId}`);

  return { success: true };
}

export async function updateFundraisingGoal(
  nonprofitId: string,
  goalCents: number | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user has access to this nonprofit
  const { data: nonprofitUser } = await supabase
    .from("nonprofit_users")
    .select("role")
    .eq("nonprofit_id", nonprofitId)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser || !["admin", "editor"].includes(nonprofitUser.role)) {
    return { success: false, error: "Not authorized to edit this nonprofit" };
  }

  // Update the fundraising goal
  const { error } = await supabase
    .from("nonprofits")
    .update({
      fundraising_goal_cents: goalCents,
    })
    .eq("id", nonprofitId);

  if (error) {
    console.error("Failed to update fundraising goal:", error);
    return { success: false, error: "Failed to update fundraising goal" };
  }

  revalidatePath("/nonprofit");
  revalidatePath("/nonprofit/goals");
  revalidatePath(`/directory/${nonprofitId}`);

  return { success: true };
}

export type ImpactReportFormData = {
  title: string;
  content: string | null;
  funds_used_cents: number | null;
  people_served: number | null;
  report_date: string | null;
};

export async function createImpactReport(
  nonprofitId: string,
  data: ImpactReportFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user has access to this nonprofit
  const { data: nonprofitUser } = await supabase
    .from("nonprofit_users")
    .select("role")
    .eq("nonprofit_id", nonprofitId)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser || !["admin", "editor"].includes(nonprofitUser.role)) {
    return { success: false, error: "Not authorized to create reports for this nonprofit" };
  }

  // Create the impact report
  const { data: report, error } = await supabase
    .from("impact_reports")
    .insert({
      nonprofit_id: nonprofitId,
      title: data.title,
      content: data.content,
      funds_used_cents: data.funds_used_cents,
      people_served: data.people_served,
      report_date: data.report_date,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create impact report:", error);
    return { success: false, error: "Failed to create impact report" };
  }

  revalidatePath("/nonprofit/reports");
  revalidatePath(`/directory/${nonprofitId}`);

  return { success: true, id: report.id };
}

export async function updateImpactReport(
  reportId: string,
  data: ImpactReportFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the report to find the nonprofit_id
  const { data: report } = await supabase
    .from("impact_reports")
    .select("nonprofit_id")
    .eq("id", reportId)
    .single();

  if (!report) {
    return { success: false, error: "Report not found" };
  }

  // Verify user has access to this nonprofit
  const { data: nonprofitUser } = await supabase
    .from("nonprofit_users")
    .select("role")
    .eq("nonprofit_id", report.nonprofit_id)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser || !["admin", "editor"].includes(nonprofitUser.role)) {
    return { success: false, error: "Not authorized to edit this report" };
  }

  // Update the impact report
  const { error } = await supabase
    .from("impact_reports")
    .update({
      title: data.title,
      content: data.content,
      funds_used_cents: data.funds_used_cents,
      people_served: data.people_served,
      report_date: data.report_date,
    })
    .eq("id", reportId);

  if (error) {
    console.error("Failed to update impact report:", error);
    return { success: false, error: "Failed to update impact report" };
  }

  revalidatePath("/nonprofit/reports");
  revalidatePath(`/directory/${report.nonprofit_id}`);

  return { success: true };
}

export async function deleteImpactReport(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the report to find the nonprofit_id
  const { data: report } = await supabase
    .from("impact_reports")
    .select("nonprofit_id")
    .eq("id", reportId)
    .single();

  if (!report) {
    return { success: false, error: "Report not found" };
  }

  // Verify user has admin access to this nonprofit
  const { data: nonprofitUser } = await supabase
    .from("nonprofit_users")
    .select("role")
    .eq("nonprofit_id", report.nonprofit_id)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser || nonprofitUser.role !== "admin") {
    return { success: false, error: "Only admins can delete reports" };
  }

  // Delete the impact report
  const { error } = await supabase
    .from("impact_reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    console.error("Failed to delete impact report:", error);
    return { success: false, error: "Failed to delete impact report" };
  }

  revalidatePath("/nonprofit/reports");
  revalidatePath(`/directory/${report.nonprofit_id}`);

  return { success: true };
}
