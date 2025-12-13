"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CampaignStatus } from "@/types/database";

interface CampaignFormData {
  nonprofitId: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  coverImageUrl?: string;
  goalCents: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  featured: boolean;
  allowPeerFundraising: boolean;
  showDonorAmounts: boolean;
}

export async function createCampaign(data: CampaignFormData) {
  const supabase = await createClient();

  // Verify admin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    return { error: "Not authorized" };
  }

  // Create campaign
  const adminClient = createAdminClient();
  const { data: campaign, error } = await adminClient
    .from("campaigns")
    .insert({
      nonprofit_id: data.nonprofitId,
      title: data.title,
      slug: data.slug,
      short_description: data.shortDescription || null,
      description: data.description || null,
      cover_image_url: data.coverImageUrl || null,
      goal_cents: data.goalCents,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status,
      featured: data.featured,
      allow_peer_fundraising: data.allowPeerFundraising,
      show_donor_amounts: data.showDonorAmounts,
    })
    .select()
    .single();

  if (error) {
    console.error("[createCampaign] Error:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/campaigns");
  revalidatePath("/campaigns");
  return { campaign };
}

export async function updateCampaign(id: string, data: Partial<CampaignFormData>) {
  const supabase = await createClient();

  // Verify admin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    return { error: "Not authorized" };
  }

  // Update campaign
  const adminClient = createAdminClient();
  const updateData: Record<string, unknown> = {};

  if (data.nonprofitId !== undefined) updateData.nonprofit_id = data.nonprofitId;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.shortDescription !== undefined) updateData.short_description = data.shortDescription || null;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.coverImageUrl !== undefined) updateData.cover_image_url = data.coverImageUrl || null;
  if (data.goalCents !== undefined) updateData.goal_cents = data.goalCents;
  if (data.startDate !== undefined) updateData.start_date = data.startDate;
  if (data.endDate !== undefined) updateData.end_date = data.endDate;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.featured !== undefined) updateData.featured = data.featured;
  if (data.allowPeerFundraising !== undefined) updateData.allow_peer_fundraising = data.allowPeerFundraising;
  if (data.showDonorAmounts !== undefined) updateData.show_donor_amounts = data.showDonorAmounts;

  const { data: campaign, error } = await adminClient
    .from("campaigns")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updateCampaign] Error:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/campaigns");
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaign.slug}`);
  return { campaign };
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient();

  // Verify admin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    return { error: "Not authorized" };
  }

  // Delete campaign
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("campaigns")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteCampaign] Error:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/campaigns");
  revalidatePath("/campaigns");
  return { success: true };
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  return updateCampaign(id, { status });
}
