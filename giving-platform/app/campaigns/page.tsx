import Link from "next/link";
import { Target, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CampaignCard } from "@/components/campaign";
import { Button } from "@/components/ui/button";
import type { Campaign, Nonprofit } from "@/types/database";

export const metadata = {
  title: "Campaigns - DonorX",
  description: "Browse active fundraising campaigns and make an impact today",
};

interface CampaignsPageProps {
  searchParams: Promise<{ status?: string; nonprofit?: string }>;
}

export default async function CampaignsPage({ searchParams }: CampaignsPageProps) {
  const { status, nonprofit } = await searchParams;
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("campaigns")
    .select(`
      *,
      nonprofit:nonprofits(id, name, logo_url)
    `)
    .in("status", ["active", "ended"])
    .order("featured", { ascending: false })
    .order("end_date", { ascending: true });

  // Filter by status if provided
  if (status === "active") {
    query = query.eq("status", "active").gt("end_date", new Date().toISOString());
  } else if (status === "ended") {
    query = query.or(`status.eq.ended,end_date.lt.${new Date().toISOString()}`);
  }

  // Filter by nonprofit if provided
  if (nonprofit) {
    query = query.eq("nonprofit_id", nonprofit);
  }

  const { data: campaigns } = await query;

  const typedCampaigns = (campaigns || []) as (Campaign & { nonprofit: Nonprofit })[];

  // Separate featured and regular campaigns
  const featuredCampaigns = typedCampaigns.filter((c) => c.featured && c.status === "active");
  const activeCampaigns = typedCampaigns.filter((c) => !c.featured && c.status === "active" && new Date(c.end_date) >= new Date());
  const endedCampaigns = typedCampaigns.filter((c) => c.status === "ended" || new Date(c.end_date) < new Date());

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Fundraising Campaigns
            </h1>
            <p className="text-lg text-emerald-100">
              Join time-limited campaigns to support causes you care about.
              Every contribution brings us closer to making a real impact.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-slate-500" />
          <Link href="/campaigns">
            <Button
              variant={!status ? "default" : "outline"}
              size="sm"
            >
              All
            </Button>
          </Link>
          <Link href="/campaigns?status=active">
            <Button
              variant={status === "active" ? "default" : "outline"}
              size="sm"
            >
              Active
            </Button>
          </Link>
          <Link href="/campaigns?status=ended">
            <Button
              variant={status === "ended" ? "default" : "outline"}
              size="sm"
            >
              Ended
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Featured Campaigns */}
        {featuredCampaigns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Featured Campaigns
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </section>
        )}

        {/* Active Campaigns */}
        {activeCampaigns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Active Campaigns
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </section>
        )}

        {/* Ended Campaigns */}
        {status !== "active" && endedCampaigns.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Past Campaigns
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {endedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {typedCampaigns.length === 0 && (
          <div className="text-center py-16">
            <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              No campaigns yet
            </h2>
            <p className="text-slate-600 mb-6">
              Check back soon for upcoming fundraising campaigns!
            </p>
            <Button asChild>
              <Link href="/directory">Browse Nonprofits</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
