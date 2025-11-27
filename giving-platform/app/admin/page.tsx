import Link from "next/link";
import { Building2, CreditCard, Users, TrendingUp, DollarSign, Calendar, CheckCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PendingApprovalButtons } from "./pending-approval-buttons";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch platform stats
  const { data: donations } = await supabase
    .from("donations")
    .select("amount_cents, status, created_at, user_id");

  const { data: nonprofits } = await supabase
    .from("nonprofits")
    .select("id, name, ein, status, category_id, created_at");

  const { data: users } = await supabase
    .from("users")
    .select("id, created_at");

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name");

  const allDonations = donations || [];
  const completedDonations = allDonations.filter((d) => d.status === "completed");
  const allNonprofits = nonprofits || [];
  const approvedNonprofits = allNonprofits.filter((n) => n.status === "approved");
  const pendingNonprofits = allNonprofits.filter((n) => n.status === "pending");
  const allUsers = users || [];
  const allCategories = categories || [];

  // Calculate stats
  const totalDonations = completedDonations.reduce((sum, d) => sum + d.amount_cents, 0);

  // This month's donations
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthDonations = completedDonations.filter(
    (d) => new Date(d.created_at) >= thisMonthStart
  );
  const thisMonthTotal = thisMonthDonations.reduce((sum, d) => sum + d.amount_cents, 0);

  // Unique donors
  const uniqueDonors = new Set(completedDonations.map((d) => d.user_id)).size;

  const stats = [
    {
      title: "Total Donations",
      value: formatCurrency(totalDonations),
      subtitle: `${completedDonations.length} donations`,
      icon: DollarSign,
      color: "blue",
    },
    {
      title: "Active Donors",
      value: uniqueDonors.toString(),
      subtitle: `${allUsers.length} total users`,
      icon: Users,
      color: "emerald",
    },
    {
      title: "Nonprofits",
      value: approvedNonprofits.length.toString(),
      subtitle: `${pendingNonprofits.length} pending approval`,
      icon: Building2,
      color: "purple",
    },
    {
      title: "This Month",
      value: formatCurrency(thisMonthTotal),
      subtitle: `${thisMonthDonations.length} donations`,
      icon: TrendingUp,
      color: "amber",
    },
  ];

  // Get category name helper
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = allCategories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  // Recent donations (last 5)
  const recentDonations = completedDonations
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.title}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    stat.color === "blue"
                      ? "bg-blue-100"
                      : stat.color === "emerald"
                      ? "bg-emerald-100"
                      : stat.color === "purple"
                      ? "bg-purple-100"
                      : "bg-amber-100"
                  }`}
                >
                  <stat.icon
                    className={`h-5 w-5 ${
                      stat.color === "blue"
                        ? "text-blue-700"
                        : stat.color === "emerald"
                        ? "text-emerald-700"
                        : stat.color === "purple"
                        ? "text-purple-700"
                        : "text-amber-700"
                    }`}
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Donations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Donations</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/donations">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No donations yet</p>
            ) : (
              <div className="space-y-4">
                {recentDonations.map((donation, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">
                        {formatCurrency(donation.amount_cents)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(donation.created_at)}
                      </p>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Approvals</CardTitle>
            {pendingNonprofits.length > 0 && (
              <Badge variant="warning">{pendingNonprofits.length} pending</Badge>
            )}
          </CardHeader>
          <CardContent>
            {pendingNonprofits.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-slate-500">All caught up!</p>
                <p className="text-sm text-slate-400">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingNonprofits.slice(0, 5).map((nonprofit) => (
                  <div
                    key={nonprofit.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{nonprofit.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        {nonprofit.ein && <span>EIN: {nonprofit.ein}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(nonprofit.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {getCategoryName(nonprofit.category_id)}
                      </Badge>
                      <PendingApprovalButtons nonprofitId={nonprofit.id} />
                    </div>
                  </div>
                ))}
                {pendingNonprofits.length > 5 && (
                  <Button variant="outline" fullWidth asChild>
                    <Link href="/admin/nonprofits?status=pending">
                      View all {pendingNonprofits.length} pending
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Button variant="outline" asChild>
              <Link href="/admin/nonprofits">
                <Building2 className="mr-2 h-4 w-4" />
                Manage Nonprofits
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/donations">
                <CreditCard className="mr-2 h-4 w-4" />
                View Donations
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/nonprofits?status=pending">
                <Clock className="mr-2 h-4 w-4" />
                Review Pending ({pendingNonprofits.length})
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
