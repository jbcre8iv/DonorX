import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, User, Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Fundraiser, Campaign } from "@/types/database";

interface FundraisersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata({ params }: FundraisersPageProps) {
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
    title: `Fundraisers - ${campaign.title}`,
    description: `View all fundraisers supporting ${campaign.title}`,
  };
}

export default async function FundraisersPage({ params, searchParams }: FundraisersPageProps) {
  const { slug } = await params;
  const { search } = await searchParams;
  const adminClient = createAdminClient();

  // Fetch campaign
  const { data: campaign, error: campaignError } = await adminClient
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  const typedCampaign = campaign as Campaign;

  // Fetch fundraisers with user data
  let query = adminClient
    .from("fundraisers")
    .select(`
      *,
      user:users(id, full_name, email)
    `)
    .eq("campaign_id", typedCampaign.id)
    .eq("is_active", true)
    .eq("show_on_leaderboard", true)
    .order("raised_cents", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,story.ilike.%${search}%`);
  }

  const { data: fundraisers } = await query;

  const typedFundraisers = (fundraisers || []) as (Fundraiser & {
    user: { id: string; full_name: string | null; email: string } | null;
  })[];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back link */}
        <Link
          href={`/campaigns/${slug}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaign
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              Fundraisers
            </h1>
            <p className="text-slate-600 mt-1">
              {typedFundraisers.length} fundraisers supporting {typedCampaign.title}
            </p>
          </div>

          {typedCampaign.allow_peer_fundraising && (
            <Button asChild>
              <Link href={`/campaigns/${slug}/fundraise`}>
                Start Your Own Fundraiser
              </Link>
            </Button>
          )}
        </div>

        {/* Search */}
        <form className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search fundraisers..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </form>

        {/* Fundraisers Grid */}
        {typedFundraisers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No fundraisers yet
              </h3>
              <p className="text-slate-600 mb-4">
                Be the first to start fundraising for this campaign!
              </p>
              {typedCampaign.allow_peer_fundraising && (
                <Button asChild>
                  <Link href={`/campaigns/${slug}/fundraise`}>
                    Start Fundraising
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {typedFundraisers.map((fundraiser, index) => {
              const rank = index + 1;
              const progress = fundraiser.personal_goal_cents > 0
                ? Math.round((fundraiser.raised_cents / fundraiser.personal_goal_cents) * 100)
                : 0;
              const displayName = fundraiser.user?.full_name || fundraiser.user?.email?.split("@")[0] || "Fundraiser";

              return (
                <Link
                  key={fundraiser.id}
                  href={`/campaigns/${slug}/f/${fundraiser.slug}`}
                  className="block"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      {/* Rank badge */}
                      {rank <= 3 && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                          rank === 1 ? "bg-amber-100 text-amber-700" :
                          rank === 2 ? "bg-slate-100 text-slate-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          <Trophy className="h-3 w-3" />
                          #{rank}
                        </div>
                      )}

                      {/* Fundraiser info */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{displayName}</p>
                          <p className="text-sm text-slate-500 line-clamp-1">{fundraiser.title}</p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-purple-600">
                            {formatCurrency(fundraiser.raised_cents)}
                          </span>
                          <span className="text-slate-500">
                            {progress}% of {formatCurrency(fundraiser.personal_goal_cents)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">
                        {fundraiser.donation_count} donations
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
