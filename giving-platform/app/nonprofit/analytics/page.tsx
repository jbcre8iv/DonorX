import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Nonprofit } from "@/types/database";

export const metadata = {
  title: "Analytics - Nonprofit Portal",
};

export default async function NonprofitAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get nonprofit from user's nonprofit_users record
  const { data: nonprofitUser } = await supabase
    .from("nonprofit_users")
    .select(`
      *,
      nonprofit:nonprofits(*)
    `)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser) {
    redirect("/nonprofit");
  }

  const nonprofit = nonprofitUser.nonprofit as unknown as Nonprofit;

  // Get all donations to this nonprofit
  const { data: allocations } = await supabase
    .from("allocations")
    .select(`
      amount_cents,
      created_at,
      donation:donations!inner(status, user_id)
    `)
    .eq("nonprofit_id", nonprofit.id)
    .eq("donation.status", "completed")
    .order("created_at", { ascending: false });

  const allDonations = allocations || [];

  // Calculate time-based metrics
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  // This month
  const thisMonthDonations = allDonations.filter(
    (d: { created_at: string }) => new Date(d.created_at) >= thisMonthStart
  );
  const thisMonthTotal = thisMonthDonations.reduce(
    (sum, d: { amount_cents: number }) => sum + d.amount_cents, 0
  );

  // Last month
  const lastMonthDonations = allDonations.filter(
    (d: { created_at: string }) => {
      const date = new Date(d.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }
  );
  const lastMonthTotal = lastMonthDonations.reduce(
    (sum, d: { amount_cents: number }) => sum + d.amount_cents, 0
  );

  // This year
  const thisYearDonations = allDonations.filter(
    (d: { created_at: string }) => new Date(d.created_at) >= thisYearStart
  );
  const thisYearTotal = thisYearDonations.reduce(
    (sum, d: { amount_cents: number }) => sum + d.amount_cents, 0
  );

  // All time
  const allTimeTotal = allDonations.reduce(
    (sum, d: { amount_cents: number }) => sum + d.amount_cents, 0
  );

  // Month over month change
  const monthChange = lastMonthTotal > 0
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : thisMonthTotal > 0 ? 100 : 0;

  // Unique donors
  const uniqueDonorIds = new Set(
    allDonations.map((d: { donation: unknown }) => {
      const donation = Array.isArray(d.donation) ? d.donation[0] : d.donation;
      return (donation as { user_id?: string })?.user_id;
    })
  );
  const totalDonors = uniqueDonorIds.size;

  const thisMonthDonorIds = new Set(
    thisMonthDonations.map((d: { donation: unknown }) => {
      const donation = Array.isArray(d.donation) ? d.donation[0] : d.donation;
      return (donation as { user_id?: string })?.user_id;
    })
  );
  const thisMonthDonors = thisMonthDonorIds.size;

  // Average donation
  const avgDonation = allDonations.length > 0
    ? allTimeTotal / allDonations.length
    : 0;

  // Monthly breakdown for chart (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthName = monthStart.toLocaleDateString("en-US", { month: "short" });

    const monthDonations = allDonations.filter((d: { created_at: string }) => {
      const date = new Date(d.created_at);
      return date >= monthStart && date <= monthEnd;
    });

    const total = monthDonations.reduce(
      (sum, d: { amount_cents: number }) => sum + d.amount_cents, 0
    );

    monthlyData.push({
      month: monthName,
      total: total / 100,
      count: monthDonations.length,
    });
  }

  const maxMonthlyTotal = Math.max(...monthlyData.map(m => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-slate-600">
          Track your donation trends and donor engagement.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">This Month</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCurrency(thisMonthTotal)}
                </p>
                <div className={`flex items-center gap-1 mt-1 text-sm ${monthChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {monthChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{Math.abs(monthChange).toFixed(1)}% vs last month</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">This Year</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCurrency(thisYearTotal)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {thisYearDonations.length} donations
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Donors</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {totalDonors}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {thisMonthDonors} this month
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg. Donation</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCurrency(avgDonation)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {allDonations.length} total donations
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <DollarSign className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Donations
          </CardTitle>
          <CardDescription>Last 6 months of donation activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyData.map((month, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-slate-600 mb-1">
                    {formatCurrency(month.total * 100)}
                  </span>
                  <div
                    className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                    style={{
                      height: `${Math.max((month.total / maxMonthlyTotal) * 180, 4)}px`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700">{month.month}</span>
                <span className="text-xs text-slate-500">{month.count} donations</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>All-Time Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Raised</span>
                <span className="font-semibold text-slate-900">{formatCurrency(allTimeTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Donations</span>
                <span className="font-semibold text-slate-900">{allDonations.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Unique Donors</span>
                <span className="font-semibold text-slate-900">{totalDonors}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Average Donation</span>
                <span className="font-semibold text-slate-900">{formatCurrency(avgDonation)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {allDonations.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No donations yet. Share your profile to start receiving donations!
              </p>
            ) : (
              <div className="space-y-3">
                {allDonations.slice(0, 5).map((donation: { amount_cents: number; created_at: string }, i: number) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">{formatCurrency(donation.amount_cents)}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(donation.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">Tips for Growing Donations</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Post regular impact reports to keep donors engaged</li>
              <li>• Share your profile on social media and email newsletters</li>
              <li>• Add the donation widget to your website</li>
              <li>• Thank donors promptly and personally when possible</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
