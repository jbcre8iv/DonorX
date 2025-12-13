"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Fundraiser } from "@/types/database";

interface CreateFundraiserInput {
  campaignId: string;
  userId: string;
  title: string;
  slug: string;
  story?: string;
  personalGoalCents: number;
  teamId?: string | null;
  coverImageUrl?: string | null;
}

export async function createFundraiser(
  input: CreateFundraiserInput
): Promise<{ fundraiser?: Fundraiser; error?: string }> {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== input.userId) {
    return { error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Check campaign exists and allows P2P
  const { data: campaign, error: campaignError } = await adminClient
    .from("campaigns")
    .select("id, slug, allow_peer_fundraising, status")
    .eq("id", input.campaignId)
    .single();

  if (campaignError || !campaign) {
    return { error: "Campaign not found" };
  }

  if (!campaign.allow_peer_fundraising) {
    return { error: "This campaign does not allow peer-to-peer fundraising" };
  }

  if (campaign.status !== "active") {
    return { error: "This campaign is not currently active" };
  }

  // Check user doesn't already have a fundraiser
  const { data: existing } = await adminClient
    .from("fundraisers")
    .select("id")
    .eq("campaign_id", input.campaignId)
    .eq("user_id", input.userId)
    .single();

  if (existing) {
    return { error: "You already have a fundraiser for this campaign" };
  }

  // Check slug is unique
  const { data: slugExists } = await adminClient
    .from("fundraisers")
    .select("id")
    .eq("campaign_id", input.campaignId)
    .eq("slug", input.slug)
    .single();

  if (slugExists) {
    return { error: "This URL is already taken. Please choose a different one." };
  }

  // Create fundraiser
  const { data: fundraiser, error } = await adminClient
    .from("fundraisers")
    .insert({
      campaign_id: input.campaignId,
      user_id: input.userId,
      team_id: input.teamId || null,
      title: input.title,
      slug: input.slug,
      story: input.story || null,
      personal_goal_cents: input.personalGoalCents,
      cover_image_url: input.coverImageUrl || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[createFundraiser] Error:", error);
    return { error: error.message };
  }

  revalidatePath(`/campaigns/${campaign.slug}`);
  revalidatePath(`/campaigns/${campaign.slug}/fundraisers`);

  return { fundraiser: fundraiser as Fundraiser };
}

export async function updateFundraiser(
  fundraiserId: string,
  updates: Partial<{
    title: string;
    story: string;
    personalGoalCents: number;
    coverImageUrl: string;
    showOnLeaderboard: boolean;
    isActive: boolean;
  }>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Check fundraiser belongs to user
  const { data: fundraiser } = await adminClient
    .from("fundraisers")
    .select("user_id, campaign_id, campaigns(slug)")
    .eq("id", fundraiserId)
    .single();

  if (!fundraiser || fundraiser.user_id !== user.id) {
    return { error: "Fundraiser not found or access denied" };
  }

  // Update fundraiser
  const updateData: Record<string, unknown> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.story !== undefined) updateData.story = updates.story;
  if (updates.personalGoalCents !== undefined) updateData.personal_goal_cents = updates.personalGoalCents;
  if (updates.coverImageUrl !== undefined) updateData.cover_image_url = updates.coverImageUrl;
  if (updates.showOnLeaderboard !== undefined) updateData.show_on_leaderboard = updates.showOnLeaderboard;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { error } = await adminClient
    .from("fundraisers")
    .update(updateData)
    .eq("id", fundraiserId);

  if (error) {
    console.error("[updateFundraiser] Error:", error);
    return { error: error.message };
  }

  const campaignSlug = (fundraiser.campaigns as unknown as { slug: string })?.slug;
  if (campaignSlug) {
    revalidatePath(`/campaigns/${campaignSlug}`);
  }

  return { success: true };
}
