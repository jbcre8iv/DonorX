import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Target, Trophy, User } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CampaignProgress } from "@/components/campaign";
import { formatCurrency } from "@/lib/utils";
import type { FundraiserTeam, Campaign, Fundraiser, User as UserType } from "@/types/database";

interface TeamPageProps {
  params: Promise<{ slug: string; teamSlug: string }>;
}

export async function generateMetadata({ params }: TeamPageProps) {
  const { slug, teamSlug } = await params;
  const adminClient = createAdminClient();

  const { data: team } = await adminClient
    .from("fundraiser_teams")
    .select(`
      name,
      campaigns!inner(slug, title)
    `)
    .eq("slug", teamSlug)
    .single();

  if (!team) {
    return { title: "Team Not Found" };
  }

  const campaign = team.campaigns as unknown as { slug: string; title: string };

  return {
    title: `${team.name} - ${campaign.title}`,
    description: `Support Team ${team.name} and help make an impact.`,
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug, teamSlug } = await params;
  const adminClient = createAdminClient();

  // Fetch team with campaign
  const { data: team, error } = await adminClient
    .from("fundraiser_teams")
    .select(`
      *,
      campaign:campaigns(*),
      captain:users(id, full_name, email)
    `)
    .eq("slug", teamSlug)
    .single();

  if (error || !team) {
    notFound();
  }

  const typedTeam = team as FundraiserTeam & {
    campaign: Campaign;
    captain: Pick<UserType, "id" | "full_name" | "email"> | null;
  };

  // Verify campaign slug matches
  if (typedTeam.campaign.slug !== slug) {
    notFound();
  }

  // Fetch team members (fundraisers)
  const { data: fundraisers } = await adminClient
    .from("fundraisers")
    .select(`
      *,
      user:users(id, full_name, email)
    `)
    .eq("team_id", typedTeam.id)
    .eq("is_active", true)
    .order("raised_cents", { ascending: false });

  const typedFundraisers = (fundraisers || []) as (Fundraiser & {
    user: Pick<UserType, "id" | "full_name" | "email"> | null;
  })[];

  const progress = typedTeam.goal_cents > 0
    ? Math.round((typedTeam.raised_cents / typedTeam.goal_cents) * 100)
    : 0;

  const captainName = typedTeam.captain?.full_name || typedTeam.captain?.email?.split("@")[0];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Link
          href={`/campaigns/${slug}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {typedTeam.campaign.title}
        </Link>
      </div>

      {/* Hero */}
      <div className="relative">
        <div className="h-48 md:h-56 bg-gradient-to-br from-indigo-500 to-indigo-700">
          {typedTeam.logo_url ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={typedTeam.logo_url}
                alt={typedTeam.name}
                className="h-24 w-24 rounded-xl object-contain bg-white p-2"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="h-24 w-24 text-white/20" />
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
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {typedTeam.name}
                </h1>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {typedTeam.member_count} members
                  </span>
                  {captainName && (
                    <span>Captain: {captainName}</span>
                  )}
                </div>

                {typedTeam.description && (
                  <p className="text-slate-600 mb-4">
                    {typedTeam.description}
                  </p>
                )}

                {/* Progress */}
                {typedTeam.goal_cents > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-3xl font-bold text-indigo-600">
                          {formatCurrency(typedTeam.raised_cents)}
                        </p>
                        <p className="text-sm text-slate-500">
                          raised of {formatCurrency(typedTeam.goal_cents)} goal
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{progress}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-indigo-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typedFundraisers.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">
                    No team members yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {typedFundraisers.map((fundraiser, index) => {
                      const rank = index + 1;
                      const displayName = fundraiser.user?.full_name || fundraiser.user?.email?.split("@")[0] || "Fundraiser";
                      const memberProgress = fundraiser.personal_goal_cents > 0
                        ? Math.round((fundraiser.raised_cents / fundraiser.personal_goal_cents) * 100)
                        : 0;

                      return (
                        <Link
                          key={fundraiser.id}
                          href={`/campaigns/${slug}/f/${fundraiser.slug}`}
                          className={`flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-shadow ${
                            rank === 1 ? "bg-amber-50 border-amber-200" :
                            rank === 2 ? "bg-slate-50 border-slate-200" :
                            rank === 3 ? "bg-orange-50 border-orange-200" :
                            "bg-white border-slate-100"
                          }`}
                        >
                          <div className="flex-shrink-0 w-6 flex justify-center">
                            {rank <= 3 ? (
                              <Trophy className={`h-5 w-5 ${
                                rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : "text-amber-700"
                              }`} />
                            ) : (
                              <span className="text-sm font-medium text-slate-400">{rank}</span>
                            )}
                          </div>

                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-slate-400" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {displayName}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-1.5 max-w-[100px]">
                                <div
                                  className="bg-purple-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(memberProgress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">{memberProgress}%</span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(fundraiser.raised_cents)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {fundraiser.donation_count} donations
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

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
                  {typedTeam.campaign.title}
                </h3>
                <p className="text-slate-600 mb-4">
                  {typedTeam.campaign.short_description || typedTeam.campaign.description}
                </p>
                <CampaignProgress
                  raisedCents={typedTeam.campaign.raised_cents}
                  goalCents={typedTeam.campaign.goal_cents}
                  donationCount={typedTeam.campaign.donation_count}
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
            {/* Join Team CTA */}
            {typedTeam.campaign.allow_peer_fundraising && (
              <Card className="sticky top-24">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-indigo-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Join {typedTeam.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Start your own fundraiser and help the team reach their goal!
                  </p>
                  <Button className="w-full" asChild>
                    <Link href={`/campaigns/${slug}/fundraise?team=${typedTeam.id}`}>
                      Join This Team
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-slate-900 mb-4">Team Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Raised</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(typedTeam.raised_cents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Team Members</span>
                    <span className="font-semibold text-slate-900">
                      {typedTeam.member_count}
                    </span>
                  </div>
                  {typedTeam.goal_cents > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold text-slate-900">
                        {progress}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
