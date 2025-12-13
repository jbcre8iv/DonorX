import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Users, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CampaignHero, DonorRoll } from "@/components/campaign";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Campaign, Nonprofit, CampaignDonation, Donation } from "@/types/database";

interface CampaignPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CampaignPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title, short_description")
    .eq("slug", slug)
    .single();

  if (!campaign) {
    return { title: "Campaign Not Found" };
  }

  return {
    title: `${campaign.title} - DonorX`,
    description: campaign.short_description || `Support the ${campaign.title} campaign on DonorX`,
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch campaign with nonprofit
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(`
      *,
      nonprofit:nonprofits(id, name, logo_url, website, mission)
    `)
    .eq("slug", slug)
    .in("status", ["active", "ended"])
    .single();

  if (error || !campaign) {
    notFound();
  }

  const typedCampaign = campaign as Campaign & { nonprofit: Nonprofit };

  // Fetch recent donations for this campaign
  const { data: campaignDonations } = await supabase
    .from("campaign_donations")
    .select(`
      *,
      donation:donations(id, amount_cents, created_at)
    `)
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const typedDonations = (campaignDonations || []) as (CampaignDonation & { donation: Donation })[];

  const isActive = campaign.status === "active" && new Date(campaign.end_date) >= new Date();
  const donateUrl = `/donate?campaign=${campaign.id}&nonprofit=${campaign.nonprofit_id}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Link
          href="/campaigns"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          All Campaigns
        </Link>
      </div>

      {/* Hero */}
      <CampaignHero campaign={typedCampaign} donateUrl={donateUrl} />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.description ? (
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: campaign.description.replace(/\n/g, "<br/>") }}
                  />
                ) : (
                  <p className="text-slate-600">
                    {campaign.short_description || "Support this campaign and help make a difference."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* About the nonprofit */}
            {typedCampaign.nonprofit && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-600" />
                    About {typedCampaign.nonprofit.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    {typedCampaign.nonprofit.mission || "A verified nonprofit organization."}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/directory/${typedCampaign.nonprofit.id}`}>
                      View Nonprofit Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Donor roll */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Donors ({campaign.donation_count})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonorRoll
                  donations={typedDonations}
                  showAmounts={typedCampaign.show_donor_amounts}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donate CTA (sticky) */}
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-slate-900">
                      {formatCurrency(campaign.raised_cents)}
                    </p>
                    <p className="text-sm text-slate-500">
                      raised of {formatCurrency(campaign.goal_cents)} goal
                    </p>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min((campaign.raised_cents / campaign.goal_cents) * 100, 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-sm text-slate-600 mb-6">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{campaign.donation_count} donors</span>
                    </div>
                    <span>
                      {Math.round((campaign.raised_cents / campaign.goal_cents) * 100)}% funded
                    </span>
                  </div>

                  {isActive ? (
                    <Button className="w-full" size="lg" asChild>
                      <Link href={donateUrl}>
                        <Heart className="mr-2 h-5 w-5" />
                        Donate Now
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" disabled variant="secondary">
                      Campaign Ended
                    </Button>
                  )}

                  {typedCampaign.allow_peer_fundraising && isActive && (
                    <Button variant="outline" className="w-full mt-3">
                      Start a Fundraiser
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Recent activity */}
              {typedDonations.length > 0 && (
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-500">
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {typedDonations.slice(0, 3).map((cd) => (
                      <div key={cd.id} className="flex items-center gap-2 text-sm">
                        <Heart className="h-3 w-3 text-rose-400" />
                        <span className="text-slate-600 truncate">
                          {cd.is_anonymous ? "Anonymous" : cd.donor_display_name || "Someone"}
                        </span>
                        {typedCampaign.show_donor_amounts && cd.donation?.amount_cents && (
                          <span className="text-slate-400 ml-auto">
                            {formatCurrency(cd.donation.amount_cents)}
                          </span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
