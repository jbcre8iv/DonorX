import Link from "next/link";
import { Building2, CreditCard, Users, TrendingUp, DollarSign, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ExpandableRecentDonations, ExpandablePendingApprovals } from "./expandable-cards";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch platform stats
  const { data: donations } = await supabase
    .from("donations")
    .select(`
      id,
      amount_cents,
      status,
      created_at,
      user_id,
      is_simulated,
      user:users(first_name, last_name, email),
      allocations(
        amount_cents,
        percentage,
        nonprofit:nonprofits(name),
        category:categories(name)
      )
    `);

  const { data: nonprofits } = await supabase
    .from("nonprofits")
    .select("id, name, ein, status, category_id, created_at, description, website, mission");

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
        {/* Recent Donations - Expandable */}
        <ExpandableRecentDonations donations={recentDonations} />

        {/* Pending Approvals - Expandable */}
        <ExpandablePendingApprovals
          nonprofits={pendingNonprofits}
          getCategoryName={getCategoryName}
        />
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
