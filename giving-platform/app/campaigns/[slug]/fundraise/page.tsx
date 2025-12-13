import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundraiserForm } from "./fundraiser-form";
import type { Campaign, FundraiserTeam } from "@/types/database";

interface StartFundraiserPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ team?: string }>;
}

export async function generateMetadata({ params }: StartFundraiserPageProps) {
  const { slug } = await params;
  const adminClient = createAdminClient();

  const { data: campaign } = await adminClient
    .from("campaigns")
    .select("title")
    .eq("slug", slug)
    .single();

  if (!campaign) {
    return { title: "Campaign Not Found" };
  }

  return {
    title: `Start a Fundraiser - ${campaign.title}`,
  };
}

export default async function StartFundraiserPage({ params, searchParams }: StartFundraiserPageProps) {
  const { slug } = await params;
  const { team: preselectedTeamId } = await searchParams;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/campaigns/${slug}/fundraise`);
  }

  // Fetch campaign
  const { data: campaign, error } = await adminClient
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !campaign) {
    notFound();
  }

  // Check if P2P is allowed
  if (!campaign.allow_peer_fundraising) {
    redirect(`/campaigns/${slug}`);
  }

  // Check if user already has a fundraiser for this campaign
  const { data: existingFundraiser } = await adminClient
    .from("fundraisers")
    .select("slug")
    .eq("campaign_id", campaign.id)
    .eq("user_id", user.id)
    .single();

  if (existingFundraiser) {
    redirect(`/campaigns/${slug}/f/${existingFundraiser.slug}`);
  }

  // Fetch teams for this campaign
  const { data: teams } = await adminClient
    .from("fundraiser_teams")
    .select("*")
    .eq("campaign_id", campaign.id)
    .order("name");

  const typedCampaign = campaign as Campaign;
  const typedTeams = (teams || []) as FundraiserTeam[];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back link */}
        <Link
          href={`/campaigns/${slug}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaign
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Start a Fundraiser
          </h1>
          <p className="text-slate-600">
            Create your personal fundraising page for <strong>{typedCampaign.title}</strong>
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Your Fundraiser Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FundraiserForm
              campaign={typedCampaign}
              teams={typedTeams}
              userId={user.id}
              preselectedTeamId={preselectedTeamId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
