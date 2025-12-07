import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, TrendingUp, Building2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

export const metadata = {
  title: "Dashboard",
};

interface Allocation {
  percentage: number;
  amount_cents: number;
  nonprofit?: { name: string } | null;
  category?: { name: string } | null;
}

interface Donation {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  allocations: Allocation[] | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

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

  const allDonations = (donations || []) as Donation[];
  const completedDonations = allDonations.filter((d) => d.status === "completed");

  // Calculate stats
  const totalDonatedCents = completedDonations.reduce(
    (sum, d) => sum + d.amount_cents,
    0
  );

  // Get unique nonprofits supported
  const nonprofitCounts = new Map<string, number>();
  completedDonations.forEach((d) => {
    d.allocations?.forEach((a) => {
      if (a.nonprofit?.name) {
        const current = nonprofitCounts.get(a.nonprofit.name) || 0;
        nonprofitCounts.set(a.nonprofit.name, current + (a.amount_cents || 0));
      }
    });
  });

  // Current year donations
  const currentYear = new Date().getFullYear();
  const thisYearDonations = completedDonations.filter(
    (d) => new Date(d.created_at).getFullYear() === currentYear
  );
  const lastYearDonations = completedDonations.filter(
    (d) => new Date(d.created_at).getFullYear() === currentYear - 1
  );

  // Stats cards
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
      value: nonprofitCounts.size.toString(),
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

  // Prepare trend data (last 12 months)
  const trendData = (() => {
    const months: { month: string; amount: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthLabel = date.toLocaleDateString("en-US", { month: "short" });

      const monthDonations = completedDonations.filter((d) => {
        const donationDate = new Date(d.completed_at || d.created_at);
        return donationDate.toISOString().slice(0, 7) === monthKey;
      });

      months.push({
        month: monthLabel,
        amount: monthDonations.reduce((sum, d) => sum + d.amount_cents, 0) / 100,
        count: monthDonations.length,
      });
    }
    return months;
  })();

  // Prepare category breakdown data
  const categoryData = (() => {
    const categories = new Map<string, number>();
    completedDonations.forEach((d) => {
      d.allocations?.forEach((a) => {
        const name = a.category?.name || "Uncategorized";
        const current = categories.get(name) || 0;
        categories.set(name, current + (a.amount_cents || 0));
      });
    });
    return Array.from(categories.entries())
      .map(([name, value]) => ({ name, value: value / 100, color: "" }))
      .sort((a, b) => b.value - a.value);
  })();

  // Top nonprofits
  const topNonprofits = Array.from(nonprofitCounts.entries())
    .map(([name, amount]) => ({ name, amount: amount / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Giving goal (default $10,000 per year)
  const givingGoal = {
    currentAmount: thisYearDonations.reduce((sum, d) => sum + d.amount_cents, 0),
    goalAmount: 1000000, // $10,000 in cents
  };

  // Streak data
  const streakData = (() => {
    const monthsWithDonations = new Set<string>();
    completedDonations.forEach((d) => {
      const date = new Date(d.completed_at || d.created_at);
      monthsWithDonations.add(date.toISOString().slice(0, 7));
    });

    // Calculate current streak
    let currentStreak = 0;
    const now = new Date();
    let checkDate = new Date(now.getFullYear(), now.getMonth(), 1);

    while (monthsWithDonations.has(checkDate.toISOString().slice(0, 7))) {
      currentStreak++;
      checkDate.setMonth(checkDate.getMonth() - 1);
    }

    // If no donation this month, check if streak was broken
    if (!monthsWithDonations.has(now.toISOString().slice(0, 7))) {
      // Check last month
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (monthsWithDonations.has(lastMonth.toISOString().slice(0, 7))) {
        // Streak continues from last month
        currentStreak = 0;
        checkDate = lastMonth;
        while (monthsWithDonations.has(checkDate.toISOString().slice(0, 7))) {
          currentStreak++;
          checkDate.setMonth(checkDate.getMonth() - 1);
        }
      }
    }

    // Calculate longest streak
    const sortedMonths = Array.from(monthsWithDonations).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prevMonth: Date | null = null;

    sortedMonths.forEach((monthStr) => {
      const month = new Date(monthStr + "-01");
      if (prevMonth) {
        const expectedNext = new Date(prevMonth);
        expectedNext.setMonth(expectedNext.getMonth() + 1);
        if (month.getTime() === expectedNext.getTime()) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      prevMonth = month;
    });
    longestStreak = Math.max(longestStreak, tempStreak);

    // Get last 6 months for display
    const streakMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      if (monthsWithDonations.has(key)) {
        streakMonths.push(key);
      }
    }

    const lastDonation = completedDonations[0];

    return {
      currentStreak,
      longestStreak,
      lastDonationDate: lastDonation?.completed_at || lastDonation?.created_at || null,
      streakMonths,
    };
  })();

  // Year over year
  const yearOverYear = {
    currentYear,
    currentYearAmount: thisYearDonations.reduce((sum, d) => sum + d.amount_cents, 0),
    previousYearAmount: lastYearDonations.reduce((sum, d) => sum + d.amount_cents, 0),
    currentYearDonations: thisYearDonations.length,
    previousYearDonations: lastYearDonations.length,
  };

  // Impact data
  const yearsWithDonations = new Set<number>();
  completedDonations.forEach((d) => {
    yearsWithDonations.add(new Date(d.created_at).getFullYear());
  });

  const impactData = {
    totalDonated: totalDonatedCents,
    nonprofitsSupported: nonprofitCounts.size,
    totalDonations: completedDonations.length,
    yearsGiving: yearsWithDonations.size,
  };

  // Recent donations for compact view
  const recentDonations = allDonations.slice(0, 5).map((d) => ({
    id: d.id,
    amount_cents: d.amount_cents,
    status: d.status,
    created_at: d.created_at,
    recipients: (d.allocations || [])
      .map((a) => a.nonprofit?.name || a.category?.name || "Unknown")
      .filter(Boolean),
  }));

  return (
    <div className="space-y-6">
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

      {/* Dashboard Charts and Widgets */}
      <DashboardCharts
        trendData={trendData}
        categoryData={categoryData}
        topNonprofits={topNonprofits}
        givingGoal={givingGoal}
        streakData={streakData}
        yearOverYear={yearOverYear}
        impactData={impactData}
        recentDonations={recentDonations}
      />

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
