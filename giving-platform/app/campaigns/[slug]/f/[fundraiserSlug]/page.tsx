import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, User, Users, Target, Share2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CampaignProgress } from "@/components/campaign";
import { formatCurrency } from "@/lib/utils";
import type { Fundraiser, Campaign, FundraiserTeam, User as UserType } from "@/types/database";

interface FundraiserPageProps {
  params: Promise<{ slug: string; fundraiserSlug: string }>;
}

export async function generateMetadata({ params }: FundraiserPageProps) {
  const { slug, fundraiserSlug } = await params;
  const adminClient = createAdminClient();

  const { data: fundraiser } = await adminClient
    .from("fundraisers")
    .select(`
      title,
      campaigns!inner(slug, title)
    `)
    .eq("slug", fundraiserSlug)
    .single();

  if (!fundraiser) {
    return { title: "Fundraiser Not Found" };
  }

  const campaign = fundraiser.campaigns as { slug: string; title: string };

  return {
    title: `${fundraiser.title} - ${campaign.title}`,
    description: `Support ${fundraiser.title} and help make an impact.`,
  };
}

export default async function FundraiserPage({ params }: FundraiserPageProps) {
  const { slug, fundraiserSlug } = await params;
  const adminClient = createAdminClient();

  // Fetch fundraiser with campaign, team, and user
  const { data: fundraiser, error } = await adminClient
    .from("fundraisers")
    .select(`
      *,
      campaign:campaigns(*),
      team:fundraiser_teams(*),
      user:users(id, full_name, email)
    `)
    .eq("slug", fundraiserSlug)
    .single();

  if (error || !fundraiser) {
    notFound();
  }

  const typedFundraiser = fundraiser as Fundraiser & {
    campaign: Campaign;
    team: FundraiserTeam | null;
    user: Pick<UserType, "id" | "full_name" | "email">;
  };

  // Verify campaign slug matches
  if (typedFundraiser.campaign.slug !== slug) {
    notFound();
  }

  const progress = typedFundraiser.personal_goal_cents > 0
    ? Math.round((typedFundraiser.raised_cents / typedFundraiser.personal_goal_cents) * 100)
    : 0;

  const displayName = typedFundraiser.user?.full_name || typedFundraiser.user?.email?.split("@")[0] || "Fundraiser";
  const donateUrl = `/donate?campaign=${typedFundraiser.campaign_id}&nonprofit=${typedFundraiser.campaign.nonprofit_id}&fundraiser=${typedFundraiser.id}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Link
          href={`/campaigns/${slug}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {typedFundraiser.campaign.title}
        </Link>
      </div>

      {/* Hero */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-br from-purple-500 to-purple-700">
          {typedFundraiser.cover_image_url ? (
            <img
              src={typedFundraiser.cover_image_url}
              alt={typedFundraiser.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Target className="h-24 w-24 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10 pb-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <Card>
              <CardContent className="p-6">
                {/* Fundraiser info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{displayName}</p>
                    <p className="text-sm text-slate-500">is fundraising for</p>
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {typedFundraiser.title}
                </h1>

                {typedFundraiser.team && (
                  <Link
                    href={`/campaigns/${slug}/t/${typedFundraiser.team.slug}`}
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mb-4"
                  >
                    <Users className="h-4 w-4" />
                    Team: {typedFundraiser.team.name}
                  </Link>
                )}

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-3xl font-bold text-purple-600">
                        {formatCurrency(typedFundraiser.raised_cents)}
                      </p>
                      <p className="text-sm text-slate-500">
                        raised of {formatCurrency(typedFundraiser.personal_goal_cents)} goal
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{progress}%</p>
                      <p className="text-sm text-slate-500">{typedFundraiser.donation_count} donations</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story */}
            {typedFundraiser.story && (
              <Card>
                <CardHeader>
                  <CardTitle>Why I&apos;m Fundraising</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate max-w-none">
                    <p className="whitespace-pre-wrap">{typedFundraiser.story}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Campaign info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  About the Campaign
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-slate-900 mb-2">
                  {typedFundraiser.campaign.title}
                </h3>
                <p className="text-slate-600 mb-4">
                  {typedFundraiser.campaign.short_description || typedFundraiser.campaign.description}
                </p>
                <CampaignProgress
                  raisedCents={typedFundraiser.campaign.raised_cents}
                  goalCents={typedFundraiser.campaign.goal_cents}
                  donationCount={typedFundraiser.campaign.donation_count}
                  size="sm"
                />
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href={`/campaigns/${slug}`}>
                    View Campaign
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donate CTA */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <Button className="w-full" size="lg" asChild>
                  <Link href={donateUrl}>
                    <Heart className="mr-2 h-5 w-5" />
                    Donate Now
                  </Link>
                </Button>

                <p className="text-center text-sm text-slate-500 mt-3">
                  Your donation supports {displayName}&apos;s fundraiser
                </p>

                <div className="border-t border-slate-200 mt-4 pt-4">
                  <Button variant="outline" className="w-full" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Start your own */}
            {typedFundraiser.campaign.allow_peer_fundraising && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-slate-600 mb-3">
                    Want to help raise more?
                  </p>
                  <Button variant="outline" asChild>
                    <Link href={`/campaigns/${slug}/fundraise`}>
                      Start Your Own Fundraiser
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
