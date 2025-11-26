import { notFound } from "next/navigation";
import Link from "next/link";
import { Heart, Calendar, Building2, DollarSign, Globe, MapPin, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("username", username)
    .eq("is_public", true)
    .single();

  if (!profile) {
    return { title: "Donor Not Found" };
  }

  return {
    title: `${profile.display_name || username} | DonorX`,
    description: profile.bio || `View ${profile.display_name || username}'s giving profile on DonorX`,
  };
}

export default async function DonorPublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // Get public profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("is_public", true)
    .single();

  if (!profile) {
    notFound();
  }

  // Get donation stats (only if user allows showing stats)
  let stats = {
    totalDonated: 0,
    donationCount: 0,
    nonprofitsSupported: 0,
    topCategories: [] as string[],
  };

  if (profile.show_donation_stats) {
    const { data: donations } = await supabase
      .from("donations")
      .select(`
        id,
        amount_cents,
        created_at,
        allocations (
          nonprofit_id,
          nonprofit:nonprofits (
            id,
            name,
            category
          )
        )
      `)
      .eq("user_id", profile.id)
      .eq("status", "completed");

    if (donations) {
      stats.totalDonated = donations.reduce((sum, d) => sum + d.amount_cents, 0);
      stats.donationCount = donations.length;

      // Count unique nonprofits and categories
      const nonprofitSet = new Set<string>();
      const categoryCount = new Map<string, number>();

      for (const donation of donations) {
        const allocations = donation.allocations as Array<{
          nonprofit_id: string;
          nonprofit: { id: string; name: string; category: string } | { id: string; name: string; category: string }[];
        }>;

        for (const allocation of allocations || []) {
          const nonprofit = Array.isArray(allocation.nonprofit)
            ? allocation.nonprofit[0]
            : allocation.nonprofit;

          if (nonprofit) {
            nonprofitSet.add(nonprofit.id);
            const count = categoryCount.get(nonprofit.category) || 0;
            categoryCount.set(nonprofit.category, count + 1);
          }
        }
      }

      stats.nonprofitsSupported = nonprofitSet.size;
      stats.topCategories = Array.from(categoryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);
    }
  }

  // Get supported nonprofits (if user allows showing them)
  let supportedNonprofits: Array<{ id: string; name: string; category: string; logo_url: string | null }> = [];

  if (profile.show_supported_nonprofits) {
    const { data: allocations } = await supabase
      .from("allocations")
      .select(`
        nonprofit:nonprofits (
          id,
          name,
          category,
          logo_url
        ),
        donation:donations!inner (
          user_id,
          status
        )
      `)
      .eq("donation.user_id", profile.id)
      .eq("donation.status", "completed");

    if (allocations) {
      const nonprofitMap = new Map<string, { id: string; name: string; category: string; logo_url: string | null }>();

      for (const allocation of allocations) {
        const nonprofit = Array.isArray(allocation.nonprofit)
          ? allocation.nonprofit[0]
          : allocation.nonprofit;

        if (nonprofit && !nonprofitMap.has(nonprofit.id)) {
          nonprofitMap.set(nonprofit.id, nonprofit);
        }
      }

      supportedNonprofits = Array.from(nonprofitMap.values());
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-4xl font-bold text-white">
              {(profile.display_name || profile.username)?.[0]?.toUpperCase() || "D"}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white">
                {profile.display_name || profile.username}
              </h1>
              {profile.bio && (
                <p className="mt-2 text-emerald-100 max-w-xl">{profile.bio}</p>
              )}
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-emerald-100">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.company && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {profile.company}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        {profile.show_donation_stats && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Given</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {formatCurrency(stats.totalDonated)}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <DollarSign className="h-5 w-5 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Donations Made</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {stats.donationCount}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Heart className="h-5 w-5 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Nonprofits Supported</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {stats.nonprofitsSupported}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Building2 className="h-5 w-5 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Focus Areas */}
        {profile.show_donation_stats && stats.topCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Focus Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.topCategories.map((category) => (
                  <Badge key={category} variant="outline" className="px-4 py-2">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supported Nonprofits */}
        {profile.show_supported_nonprofits && supportedNonprofits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Supported Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {supportedNonprofits.map((nonprofit) => (
                  <Link
                    key={nonprofit.id}
                    href={`/directory/${nonprofit.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-lg font-semibold text-slate-600">
                      {nonprofit.logo_url ? (
                        <img
                          src={nonprofit.logo_url}
                          alt={nonprofit.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        nonprofit.name[0]
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{nonprofit.name}</p>
                      <p className="text-sm text-slate-500">{nonprofit.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">Inspired to give?</p>
                <p className="text-sm text-slate-500">
                  Start your own giving journey and make a difference today.
                </p>
              </div>
              <Button asChild>
                <Link href="/donate">
                  <Heart className="mr-2 h-4 w-4" />
                  Start Giving
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Directory */}
        <div className="text-center pt-4">
          <Link
            href="/directory"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Browse Nonprofit Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
