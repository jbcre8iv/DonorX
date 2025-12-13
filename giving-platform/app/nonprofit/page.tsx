import { redirect } from "next/navigation";
import Link from "next/link";
import { DollarSign, Users, FileText, TrendingUp, Plus, Target } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DonationThermometer } from "@/components/ui/donation-thermometer";
import { formatCurrency } from "@/lib/utils";
import type { Nonprofit } from "@/types/database";

export const metadata = {
  title: "Nonprofit Dashboard",
};

export default async function NonprofitDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get nonprofit from user's nonprofit_users record
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  const { data: nonprofitUser } = await adminClient
    .from("nonprofit_users")
    .select(`
      *,
      nonprofit:nonprofits(*)
    `)
    .eq("user_id", user.id)
    .single();

  // Layout handles the access denied case, so if we're here we have a nonprofit
  if (!nonprofitUser) {
    redirect("/nonprofit");
  }

  const nonprofit = nonprofitUser.nonprofit as unknown as Nonprofit;

  // Get donations to this nonprofit
  const { data: allocations } = await supabase
    .from("allocations")
    .select(`
      amount_cents,
      created_at,
      donation:donations!inner(status)
    `)
    .eq("nonprofit_id", nonprofit.id)
    .eq("donation.status", "completed");

  const totalReceived = (allocations || []).reduce(
    (sum, a: { amount_cents: number }) => sum + a.amount_cents,
    0
  );

  // This month's donations
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTotal = (allocations || [])
    .filter((a: { created_at: string }) => new Date(a.created_at) >= thisMonthStart)
    .reduce((sum, a: { amount_cents: number }) => sum + a.amount_cents, 0);

  // Get impact reports count
  const { count: reportCount } = await supabase
    .from("impact_reports")
    .select("id", { count: "exact", head: true })
    .eq("nonprofit_id", nonprofit.id);

  // Get unique donors count
  const { data: donorData } = await supabase
    .from("allocations")
    .select(`
      donation:donations!inner(user_id, status)
    `)
    .eq("nonprofit_id", nonprofit.id)
    .eq("donation.status", "completed");

  const uniqueDonors = new Set(
    (donorData || []).map((d: Record<string, unknown>) => {
      const donation = Array.isArray(d.donation) ? d.donation[0] : d.donation;
      return donation?.user_id;
    })
  ).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{nonprofit.name}</h1>
          <p className="text-slate-600">Nonprofit Dashboard</p>
        </div>
        <Button asChild>
          <Link href="/nonprofit/reports/new">
            <Plus className="mr-2 h-4 w-4" />
            New Impact Report
          </Link>
        </Button>
      </div>

      {/* Fundraising Progress */}
      {nonprofit.fundraising_goal_cents && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Fundraising Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonationThermometer
              current={nonprofit.total_raised_cents || 0}
              goal={nonprofit.fundraising_goal_cents}
              size="md"
              showAmounts={true}
              showPercentage={true}
              animate={true}
            />
            <p className="mt-3 text-sm text-slate-500">
              <Link href="/nonprofit/goals" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Manage your fundraising goal &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Received</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCurrency(totalReceived)}
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
                <p className="text-sm text-slate-600">This Month</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCurrency(thisMonthTotal)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Donors</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {uniqueDonors}
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
                <p className="text-sm text-slate-600">Impact Reports</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {reportCount || 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <FileText className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Share Your Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Keep your donors informed by sharing regular updates about how their
              contributions are making a difference.
            </p>
            <Button asChild>
              <Link href="/nonprofit/reports/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Impact Report
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Track your donation trends, donor demographics, and engagement metrics
              to better understand your supporter base.
            </p>
            <Button variant="outline" asChild>
              <Link href="/nonprofit/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-1">
              Best Practices for Impact Reports
            </h3>
            <ul className="text-sm text-blue-700 space-y-1 mt-2">
              <li>• Share specific outcomes and metrics when possible</li>
              <li>• Include photos or videos of your work in action</li>
              <li>• Post updates at least quarterly to keep donors engaged</li>
              <li>• Thank your donors and acknowledge their contribution</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
