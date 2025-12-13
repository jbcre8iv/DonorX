import Link from "next/link";
import { Target, Plus, ExternalLink, Calendar, Users } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Campaign, Nonprofit } from "@/types/database";

export const metadata = {
  title: "Campaign Management - Admin",
};

function getStatusBadge(status: string, endDate: string) {
  const isExpired = new Date(endDate) < new Date();

  if (status === "draft") {
    return <Badge variant="secondary">Draft</Badge>;
  }
  if (status === "ended" || isExpired) {
    return <Badge variant="outline">Ended</Badge>;
  }
  if (status === "active") {
    return <Badge variant="success">Active</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

export default async function AdminCampaignsPage() {
  const supabase = await createClient();

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    adminClient = supabase;
  }

  // Fetch all campaigns with nonprofit info
  const { data: campaigns } = await adminClient
    .from("campaigns")
    .select(`
      *,
      nonprofit:nonprofits(id, name, logo_url)
    `)
    .order("created_at", { ascending: false });

  const typedCampaigns = (campaigns || []) as (Campaign & { nonprofit: Nonprofit })[];

  // Calculate stats
  const activeCampaigns = typedCampaigns.filter(
    (c) => c.status === "active" && new Date(c.end_date) >= new Date()
  );
  const totalRaised = typedCampaigns.reduce((sum, c) => sum + c.raised_cents, 0);
  const totalDonations = typedCampaigns.reduce((sum, c) => sum + c.donation_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
          <p className="text-slate-600">
            Manage time-limited fundraising campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Campaigns</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {typedCampaigns.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Active Campaigns</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {activeCampaigns.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Raised</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalRaised)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Donations</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {totalDonations}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns ({typedCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {typedCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No campaigns yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Create your first fundraising campaign
              </p>
              <Button className="mt-4" asChild>
                <Link href="/admin/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {typedCampaigns.map((campaign) => {
                const progress = Math.round(
                  (campaign.raised_cents / campaign.goal_cents) * 100
                );

                return (
                  <div
                    key={campaign.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between rounded-lg border border-slate-200 p-4 gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {campaign.cover_image_url ? (
                        <img
                          src={campaign.cover_image_url}
                          alt={campaign.title}
                          className="h-16 w-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-24 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                          <Target className="h-6 w-6 text-white/50" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-slate-900 truncate">
                            {campaign.title}
                          </h3>
                          {getStatusBadge(campaign.status, campaign.end_date)}
                          {campaign.featured && (
                            <Badge className="bg-amber-500 text-white">Featured</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {campaign.nonprofit?.name || "Unknown nonprofit"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(campaign.start_date).toLocaleDateString()} -{" "}
                            {new Date(campaign.end_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.donation_count} donors
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Progress */}
                      <div className="w-full sm:w-48">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">
                            {formatCurrency(campaign.raised_cents)}
                          </span>
                          <span className="text-slate-500">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          of {formatCurrency(campaign.goal_cents)} goal
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/campaigns/${campaign.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`/campaigns/${campaign.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
