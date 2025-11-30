import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Heart, Building2, Users, DollarSign, Clock, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Donors - Admin",
};

interface DonorOrganization {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
  website: string | null;
  created_at: string;
  total_donated: number;
  donation_count: number;
  last_donation_date: string | null;
  users: Array<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  }>;
}

const typeLabels: Record<string, string> = {
  corporation: "Corporation",
  family_office: "Family Office",
  foundation: "Foundation",
  individual: "Individual",
};

const typeColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
  corporation: "default",
  family_office: "success",
  foundation: "warning",
  individual: "secondary",
};

export default async function AdminDonorsPage() {
  const adminClient = createAdminClient();

  // Fetch all organizations with their users and donation stats
  const { data: orgData, error: orgError } = await adminClient
    .from("organizations")
    .select(`
      id,
      name,
      type,
      logo_url,
      website,
      created_at,
      users(id, email, first_name, last_name)
    `)
    .order("created_at", { ascending: false });

  if (orgError) {
    console.error("[AdminDonorsPage] Error fetching organizations:", orgError.message);
  }

  // Fetch donation stats per organization
  const { data: donationStats } = await adminClient
    .from("donations")
    .select("organization_id, amount_cents, status, completed_at")
    .eq("status", "completed");

  // Calculate stats per organization
  const orgStatsMap = new Map<string, { total: number; count: number; lastDate: string | null }>();

  (donationStats || []).forEach((d) => {
    if (d.organization_id) {
      const existing = orgStatsMap.get(d.organization_id) || { total: 0, count: 0, lastDate: null };
      existing.total += d.amount_cents;
      existing.count += 1;
      if (!existing.lastDate || (d.completed_at && d.completed_at > existing.lastDate)) {
        existing.lastDate = d.completed_at;
      }
      orgStatsMap.set(d.organization_id, existing);
    }
  });

  // Combine organization data with donation stats
  const donors: DonorOrganization[] = (orgData || []).map((org) => {
    const stats = orgStatsMap.get(org.id) || { total: 0, count: 0, lastDate: null };
    const users = Array.isArray(org.users) ? org.users : org.users ? [org.users] : [];

    return {
      id: org.id,
      name: org.name,
      type: org.type,
      logo_url: org.logo_url,
      website: org.website,
      created_at: org.created_at,
      total_donated: stats.total,
      donation_count: stats.count,
      last_donation_date: stats.lastDate,
      users: users as DonorOrganization["users"],
    };
  });

  // Calculate summary stats
  const totalDonors = donors.length;
  const activeDonors = donors.filter((d) => d.donation_count > 0).length;
  const totalDonated = donors.reduce((sum, d) => sum + d.total_donated, 0);
  const totalDonations = donors.reduce((sum, d) => sum + d.donation_count, 0);

  // Count by type
  const byType = {
    corporation: donors.filter((d) => d.type === "corporation").length,
    family_office: donors.filter((d) => d.type === "family_office").length,
    foundation: donors.filter((d) => d.type === "foundation").length,
    individual: donors.filter((d) => d.type === "individual").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-purple-900">Donors</h1>
        <p className="text-purple-700/70">Manage donor organizations and their accounts</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Organizations</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{totalDonors}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Donors</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">{activeDonors}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Heart className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Donated</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(totalDonated)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Donations</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{totalDonations}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Organization Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">Corporation</Badge>
              <span className="text-sm text-slate-600">{byType.corporation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">Family Office</Badge>
              <span className="text-sm text-slate-600">{byType.family_office}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">Foundation</Badge>
              <span className="text-sm text-slate-600">{byType.foundation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Individual</Badge>
              <span className="text-sm text-slate-600">{byType.individual}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Donor Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {donors.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No donor organizations yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Organizations will appear here when users register
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">Organization</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">Type</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">Members</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-600">Total Donated</th>
                    <th className="pb-3 text-center text-sm font-medium text-slate-600">Donations</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">Last Activity</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donors.map((donor) => (
                    <tr key={donor.id} className="hover:bg-slate-50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                            {donor.logo_url ? (
                              <img
                                src={donor.logo_url}
                                alt={donor.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{donor.name}</p>
                            {donor.website && (
                              <a
                                href={donor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {donor.website.replace(/^https?:\/\//, "")}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant={typeColors[donor.type] || "default"}>
                          {typeLabels[donor.type] || donor.type}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Users className="h-4 w-4" />
                          {donor.users.length}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        {donor.total_donated > 0 ? (
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(donor.total_donated)}
                          </span>
                        ) : (
                          <span className="text-slate-400">$0.00</span>
                        )}
                      </td>
                      <td className="py-4 text-center">
                        {donor.donation_count > 0 ? (
                          <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                            {donor.donation_count}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-4">
                        {donor.last_donation_date ? (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(donor.last_donation_date)}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">No donations</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(donor.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
