import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { StatsGrid } from "@/components/dashboard/stats-grid";

export const metadata = {
  title: "Dashboard",
};

// Force dynamic rendering to ensure filters work correctly
export const dynamic = "force-dynamic";

interface Allocation {
  percentage: number;
  amount_cents: number;
  nonprofit_id?: string | null;
  category_id?: string | null;
  nonprofit?: { name: string; category_id?: string | null; category?: { name: string } | null } | null;
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

interface DashboardPageProps {
  searchParams: Promise<{
    range?: string;
    start?: string;
    end?: string;
    minAmount?: string;
    maxAmount?: string;
    categories?: string;
    nonprofits?: string;
  }>;
}

function getDateRangeFromFilter(range: string, start?: string, end?: string): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = new Date();

  switch (range) {
    case "ytd":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "12m":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      break;
    case "6m":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "3m":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "30d":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "custom":
      if (start) startDate = new Date(start);
      if (end) endDate = new Date(end);
      break;
    default:
      // "all" - no date filter
      startDate = null;
      endDate = null;
  }

  return { startDate, endDate };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch current year's giving goal from giving_goals table
  const currentYear = new Date().getFullYear();
  const { data: currentYearGoal } = await supabase
    .from("giving_goals")
    .select("goal_cents")
    .eq("user_id", user.id)
    .eq("year", currentYear)
    .single();

  // Fetch all goals for history (past years)
  const { data: allGoals } = await supabase
    .from("giving_goals")
    .select("year, goal_cents")
    .eq("user_id", user.id)
    .order("year", { ascending: false });

  // Parse filter params
  const dateRange = params.range || "all";
  const { startDate, endDate } = getDateRangeFromFilter(dateRange, params.start, params.end);
  // Amount filter - values from URL are in dollars, database amount_cents is also in dollars (misnomer)
  const minAmountFilter = params.minAmount ? parseInt(params.minAmount, 10) : null;
  const maxAmountFilter = params.maxAmount ? parseInt(params.maxAmount, 10) : null;
  const categoryFilter = params.categories?.split(",").filter(Boolean) || [];
  const nonprofitFilter = params.nonprofits?.split(",").filter(Boolean) || [];

  // Fetch user's donations with allocations
  const { data: donations } = await supabase
    .from("donations")
    .select(`
      *,
      allocations(
        percentage,
        amount_cents,
        nonprofit_id,
        category_id,
        nonprofit:nonprofits(name, category_id, category:categories(name)),
        category:categories(name)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allDonations = (donations || []) as Donation[];
  const completedDonations = allDonations.filter((d) => d.status === "completed");

  // Get unique categories and nonprofits for filter options
  // Include categories from both direct allocations AND from nonprofits
  const categoriesSet = new Map<string, string>();
  const nonprofitsSet = new Map<string, string>();

  completedDonations.forEach((d) => {
    d.allocations?.forEach((a) => {
      // Direct category on allocation
      if (a.category_id && a.category?.name) {
        categoriesSet.set(a.category_id, a.category.name);
      }
      // Category from nonprofit
      if (a.nonprofit?.category_id && a.nonprofit?.category?.name) {
        categoriesSet.set(a.nonprofit.category_id, a.nonprofit.category.name);
      }
      if (a.nonprofit_id && a.nonprofit?.name) {
        nonprofitsSet.set(a.nonprofit_id, a.nonprofit.name);
      }
    });
  });

  const filterCategories = Array.from(categoriesSet.entries()).map(([id, name]) => ({ id, name }));
  const filterNonprofits = Array.from(nonprofitsSet.entries()).map(([id, name]) => ({ id, name }));

  // Apply filters to completed donations
  let filteredDonations = completedDonations;

  // Date filter
  if (startDate || endDate) {
    filteredDonations = filteredDonations.filter((d) => {
      const donationDate = new Date(d.completed_at || d.created_at);
      if (startDate && donationDate < startDate) return false;
      if (endDate && donationDate > endDate) return false;
      return true;
    });
  }

  // Category filter - check both allocation's category and nonprofit's category
  if (categoryFilter.length > 0) {
    filteredDonations = filteredDonations.filter((d) =>
      d.allocations?.some((a) => {
        const effectiveCategoryId = a.category_id || a.nonprofit?.category_id;
        return effectiveCategoryId && categoryFilter.includes(effectiveCategoryId);
      })
    );
  }

  // Nonprofit filter
  if (nonprofitFilter.length > 0) {
    filteredDonations = filteredDonations.filter((d) =>
      d.allocations?.some((a) => a.nonprofit_id && nonprofitFilter.includes(a.nonprofit_id))
    );
  }

  // Amount filter - values are in dollars, amount_cents is actually in dollars (misnomer)
  if (minAmountFilter !== null || maxAmountFilter !== null) {
    filteredDonations = filteredDonations.filter((d) => {
      // Convert amount_cents (which is actually in cents) to dollars for comparison
      const amountDollars = d.amount_cents / 100;
      if (minAmountFilter !== null && amountDollars < minAmountFilter) return false;
      if (maxAmountFilter !== null && amountDollars > maxAmountFilter) return false;
      return true;
    });
  }

  // Calculate stats from filtered data
  const totalDonatedCents = filteredDonations.reduce(
    (sum, d) => sum + d.amount_cents,
    0
  );

  // Get unique nonprofits supported (filtered)
  // When category filter is active, only count nonprofits that belong to those categories
  const nonprofitCounts = new Map<string, number>();
  filteredDonations.forEach((d) => {
    d.allocations?.forEach((a) => {
      if (a.nonprofit?.name) {
        // Apply nonprofit filter
        if (nonprofitFilter.length > 0 && (!a.nonprofit_id || !nonprofitFilter.includes(a.nonprofit_id))) {
          return;
        }
        // Apply category filter - check if nonprofit belongs to selected categories
        if (categoryFilter.length > 0) {
          const effectiveCategoryId = a.category_id || a.nonprofit?.category_id;
          if (!effectiveCategoryId || !categoryFilter.includes(effectiveCategoryId)) {
            return;
          }
        }
        const current = nonprofitCounts.get(a.nonprofit.name) || 0;
        nonprofitCounts.set(a.nonprofit.name, current + (a.amount_cents || 0));
      }
    });
  });

  // Current year donations (from filtered set)
  const thisYearDonations = filteredDonations.filter(
    (d) => new Date(d.created_at).getFullYear() === currentYear
  );
  // Last year donations - apply same category/nonprofit filters for consistent comparison
  let lastYearDonations = completedDonations.filter(
    (d) => new Date(d.created_at).getFullYear() === currentYear - 1
  );
  if (categoryFilter.length > 0) {
    lastYearDonations = lastYearDonations.filter((d) =>
      d.allocations?.some((a) => {
        const effectiveCategoryId = a.category_id || a.nonprofit?.category_id;
        return effectiveCategoryId && categoryFilter.includes(effectiveCategoryId);
      })
    );
  }
  if (nonprofitFilter.length > 0) {
    lastYearDonations = lastYearDonations.filter((d) =>
      d.allocations?.some((a) => a.nonprofit_id && nonprofitFilter.includes(a.nonprofit_id))
    );
  }

  // Stats values for animated grid
  const statsData = {
    totalDonated: Math.round(totalDonatedCents / 100),
    donationsCount: filteredDonations.length,
    nonprofitsCount: nonprofitCounts.size,
    receiptsCount: filteredDonations.length,
    subtitleTotal: dateRange === "all" ? "All time" : "Filtered",
    subtitleDonations: dateRange === "all" ? currentYear.toString() : "Filtered",
  };

  // Calculate additional stats for flyouts
  const averageDonation = filteredDonations.length > 0
    ? Math.round(totalDonatedCents / filteredDonations.length / 100)
    : 0;
  const largestDonation = filteredDonations.length > 0
    ? Math.round(Math.max(...filteredDonations.map(d => d.amount_cents)) / 100)
    : 0;
  const lastDonationDate = filteredDonations[0]?.completed_at || filteredDonations[0]?.created_at || null;

  // Nonprofit summaries for flyout (with donation counts)
  // Apply same category/nonprofit filters as nonprofitCounts
  const nonprofitDonationCounts = new Map<string, number>();
  filteredDonations.forEach((d) => {
    d.allocations?.forEach((a) => {
      if (a.nonprofit?.name) {
        // Apply nonprofit filter
        if (nonprofitFilter.length > 0 && (!a.nonprofit_id || !nonprofitFilter.includes(a.nonprofit_id))) {
          return;
        }
        // Apply category filter
        if (categoryFilter.length > 0) {
          const effectiveCategoryId = a.category_id || a.nonprofit?.category_id;
          if (!effectiveCategoryId || !categoryFilter.includes(effectiveCategoryId)) {
            return;
          }
        }
        const current = nonprofitDonationCounts.get(a.nonprofit.name) || 0;
        nonprofitDonationCounts.set(a.nonprofit.name, current + 1);
      }
    });
  });
  const nonprofitSummaries = Array.from(nonprofitCounts.entries())
    .map(([name, amount]) => ({
      name,
      amount: amount / 100,
      donationCount: nonprofitDonationCounts.get(name) || 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Receipt summaries by year
  const receiptsByYear = new Map<number, { count: number; total: number }>();
  filteredDonations.forEach((d) => {
    const year = new Date(d.completed_at || d.created_at).getFullYear();
    const current = receiptsByYear.get(year) || { count: 0, total: 0 };
    receiptsByYear.set(year, {
      count: current.count + 1,
      total: current.total + d.amount_cents,
    });
  });
  const receiptSummaries = Array.from(receiptsByYear.entries())
    .map(([year, data]) => ({
      year,
      count: data.count,
      total: data.total / 100,
    }))
    .sort((a, b) => b.year - a.year);

  // Prepare trend data (last 12 months from filtered data)
  const trendData = (() => {
    const months: { month: string; amount: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthLabel = date.toLocaleDateString("en-US", { month: "short" });

      const monthDonations = filteredDonations.filter((d) => {
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

  // Prepare category breakdown data (filtered)
  // Use allocation's category first, then fall back to nonprofit's category
  const categoryData = (() => {
    const categories = new Map<string, number>();
    filteredDonations.forEach((d) => {
      d.allocations?.forEach((a) => {
        // Get category name: allocation's direct category OR nonprofit's category OR "Uncategorized"
        const categoryName = a.category?.name || a.nonprofit?.category?.name || "Uncategorized";
        const effectiveCategoryId = a.category_id || a.nonprofit?.category_id;

        // Apply category filter
        if (categoryFilter.length === 0 || (effectiveCategoryId && categoryFilter.includes(effectiveCategoryId))) {
          const current = categories.get(categoryName) || 0;
          categories.set(categoryName, current + (a.amount_cents || 0));
        }
      });
    });
    return Array.from(categories.entries())
      .map(([name, value]) => ({ name, value: value / 100, color: "" }))
      .sort((a, b) => b.value - a.value);
  })();

  // Top nonprofits (filtered) - get top 8 for expanded chart
  const topNonprofits = Array.from(nonprofitCounts.entries())
    .map(([name, amount]) => ({ name, amount: amount / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Giving goal (based on filtered this year data)
  // Default to $10,000 (1000000 cents) if no goal set
  // Calculate donations per year for past goals
  const donationsByYear = new Map<number, number>();
  completedDonations.forEach((d) => {
    const year = new Date(d.completed_at || d.created_at).getFullYear();
    const current = donationsByYear.get(year) || 0;
    donationsByYear.set(year, current + d.amount_cents);
  });

  const givingGoal = {
    currentAmount: thisYearDonations.reduce((sum, d) => sum + d.amount_cents, 0),
    goalAmount: currentYearGoal?.goal_cents || 1000000,
    allGoals: (allGoals || []).map((g) => ({
      ...g,
      donated_cents: donationsByYear.get(g.year) || 0,
    })),
  };

  // Streak data (uses all completed, not filtered)
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
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (monthsWithDonations.has(lastMonth.toISOString().slice(0, 7))) {
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

  // Year over year (uses all data for comparison)
  const yearOverYear = {
    currentYear,
    currentYearAmount: thisYearDonations.reduce((sum, d) => sum + d.amount_cents, 0),
    previousYearAmount: lastYearDonations.reduce((sum, d) => sum + d.amount_cents, 0),
    currentYearDonations: thisYearDonations.length,
    previousYearDonations: lastYearDonations.length,
  };

  // Impact data (from filtered data)
  const yearsWithDonations = new Set<number>();
  filteredDonations.forEach((d) => {
    yearsWithDonations.add(new Date(d.created_at).getFullYear());
  });

  const impactData = {
    totalDonated: totalDonatedCents,
    nonprofitsSupported: nonprofitCounts.size,
    totalDonations: filteredDonations.length,
    yearsGiving: yearsWithDonations.size,
  };

  // Recent donations for compact view (from filtered data)
  const recentDonations = filteredDonations.slice(0, 5).map((d) => ({
    id: d.id,
    amount_cents: d.amount_cents,
    status: d.status,
    created_at: d.created_at,
    recipients: (d.allocations || [])
      .map((a) => a.nonprofit?.name || a.category?.name || "Unknown")
      .filter(Boolean),
  }));

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Welcome back! Here&apos;s your giving overview.
          </p>
        </div>
        <DashboardFilters
          categories={filterCategories}
          nonprofits={filterNonprofits}
        />
      </div>

      {/* Stats Grid */}
      <StatsGrid
        totalDonated={statsData.totalDonated}
        donationsCount={statsData.donationsCount}
        nonprofitsCount={statsData.nonprofitsCount}
        receiptsCount={statsData.receiptsCount}
        subtitleTotal={statsData.subtitleTotal}
        subtitleDonations={statsData.subtitleDonations}
        recentDonations={recentDonations}
        nonprofitSummaries={nonprofitSummaries}
        receiptSummaries={receiptSummaries}
        averageDonation={averageDonation}
        largestDonation={largestDonation}
        lastDonationDate={lastDonationDate}
      />

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
    </div>
  );
}
