import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Trophy, Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { FundraiserTeam, Campaign } from "@/types/database";

interface TeamsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata({ params }: TeamsPageProps) {
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
    title: `Teams - ${campaign.title}`,
    description: `View all teams supporting ${campaign.title}`,
  };
}

export default async function TeamsPage({ params, searchParams }: TeamsPageProps) {
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

  // Fetch teams
  let query = adminClient
    .from("fundraiser_teams")
    .select("*")
    .eq("campaign_id", typedCampaign.id)
    .order("raised_cents", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: teams } = await query;

  const typedTeams = (teams || []) as FundraiserTeam[];

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" />
            Teams
          </h1>
          <p className="text-slate-600 mt-1">
            {typedTeams.length} teams supporting {typedCampaign.title}
          </p>
        </div>

        {/* Search */}
        <form className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </form>

        {/* Teams Grid */}
        {typedTeams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No teams yet
              </h3>
              <p className="text-slate-600">
                Teams will appear here once they&apos;re created.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {typedTeams.map((team, index) => {
              const rank = index + 1;
              const progress = team.goal_cents > 0
                ? Math.round((team.raised_cents / team.goal_cents) * 100)
                : 0;

              return (
                <Link
                  key={team.id}
                  href={`/campaigns/${slug}/t/${team.slug}`}
                  className="block"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                    {/* Header with logo */}
                    <div className="h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center relative">
                      {rank <= 3 && (
                        <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          rank === 1 ? "bg-amber-100 text-amber-700" :
                          rank === 2 ? "bg-slate-100 text-slate-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          <Trophy className="h-3 w-3" />
                          #{rank}
                        </div>
                      )}
                      {team.logo_url ? (
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="h-12 w-12 rounded-lg object-contain bg-white p-1"
                        />
                      ) : (
                        <Users className="h-10 w-10 text-white/30" />
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {team.name}
                      </h3>

                      <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                        <Users className="h-4 w-4" />
                        <span>{team.member_count} members</span>
                      </div>

                      {team.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {team.description}
                        </p>
                      )}

                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-indigo-600">
                            {formatCurrency(team.raised_cents)}
                          </span>
                          {team.goal_cents > 0 && (
                            <span className="text-slate-500">
                              {progress}% of {formatCurrency(team.goal_cents)}
                            </span>
                          )}
                        </div>
                        {team.goal_cents > 0 && (
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
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
