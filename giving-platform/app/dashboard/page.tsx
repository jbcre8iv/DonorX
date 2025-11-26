import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, TrendingUp, Building2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's donations with allocations
  const { data: donations } = await supabase
    .from("donations")
    .select(`
      *,
      allocations(
        percentage,
        amount_cents,
        nonprofit:nonprofits(name),
        category:categories(name)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allDonations = donations || [];
  const completedDonations = allDonations.filter((d) => d.status === "completed");

  // Calculate stats
  const totalDonatedCents = completedDonations.reduce(
    (sum, d) => sum + d.amount_cents,
    0
  );

  // Get unique nonprofits supported
  const nonprofitIds = new Set<string>();
  completedDonations.forEach((d) => {
    d.allocations?.forEach((a: { nonprofit?: { name: string } | null }) => {
      if (a.nonprofit) {
        nonprofitIds.add(JSON.stringify(a.nonprofit));
      }
    });
  });

  // Current year donations
  const currentYear = new Date().getFullYear();
  const thisYearDonations = completedDonations.filter(
    (d) => new Date(d.created_at).getFullYear() === currentYear
  );

  const stats = [
    {
      title: "Total Donated",
      value: formatCurrency(totalDonatedCents),
      subtitle: "All time",
      icon: TrendingUp,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-700",
    },
    {
      title: "Donations This Year",
      value: thisYearDonations.length.toString(),
      subtitle: currentYear.toString(),
      icon: CreditCard,
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-700",
    },
    {
      title: "Nonprofits Supported",
      value: nonprofitIds.size.toString(),
      subtitle: "Organizations",
      icon: Building2,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-700",
    },
    {
      title: "Tax Receipts",
      value: completedDonations.length.toString(),
      subtitle: "Available",
      icon: FileText,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-700",
    },
  ];

  // Recent donations (last 5)
  const recentDonations = allDonations.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">
            Welcome back! Here&apos;s your giving overview.
          </p>
        </div>
        <Button asChild>
          <Link href="/donate">Make a Donation</Link>
        </Button>
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
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Donations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Donations</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/history">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentDonations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No donations yet.</p>
              <Button asChild className="mt-4">
                <Link href="/donate">Make Your First Donation</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDonations.map((donation) => {
                const recipients = donation.allocations
                  ?.map(
                    (a: {
                      nonprofit?: { name: string } | null;
                      category?: { name: string } | null;
                    }) =>
                      a.nonprofit?.name || a.category?.name || "Unknown"
                  )
                  .filter(Boolean);

                return (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          donation.status === "completed"
                            ? "bg-emerald-100"
                            : donation.status === "pending"
                            ? "bg-amber-100"
                            : "bg-red-100"
                        }`}
                      >
                        <CreditCard
                          className={`h-5 w-5 ${
                            donation.status === "completed"
                              ? "text-emerald-600"
                              : donation.status === "pending"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatCurrency(donation.amount_cents)}
                        </p>
                        <p className="text-sm text-slate-500 truncate max-w-xs">
                          {recipients?.slice(0, 2).join(", ")}
                          {recipients && recipients.length > 2 && ` +${recipients.length - 2} more`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          donation.status === "completed"
                            ? "success"
                            : donation.status === "pending"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {donation.status.charAt(0).toUpperCase() +
                          donation.status.slice(1)}
                      </Badge>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(donation.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/donate">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
            <CardContent className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 mb-4">
                <CreditCard className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="font-semibold text-slate-900">New Donation</h3>
              <p className="mt-1 text-sm text-slate-600">
                Support causes you care about
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/receipts">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
            <CardContent className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 mb-4">
                <FileText className="h-6 w-6 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Tax Receipts</h3>
              <p className="mt-1 text-sm text-slate-600">
                Download your tax documents
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/templates">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
            <CardContent className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 mb-4">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Templates</h3>
              <p className="mt-1 text-sm text-slate-600">
                Save your favorite allocations
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
