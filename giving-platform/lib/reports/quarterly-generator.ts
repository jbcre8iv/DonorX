import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export interface QuarterlyReportData {
  quarter: string;
  year: number;
  startDate: Date;
  endDate: Date;
  totalDonated: number;
  donationCount: number;
  nonprofitsSupported: number;
  allocations: AllocationSummary[];
  impactHighlights: ImpactHighlight[];
}

export interface QuarterlyReportResult {
  report: QuarterlyReportData | null;
  debug: {
    allUserDonationsCount: number;
    filteredDonationsCount: number;
    queryError: string | null;
    checkError: string | null;
  };
}

interface AllocationSummary {
  nonprofitId: string;
  nonprofitName: string;
  category: string;
  totalAmount: number;
  donationCount: number;
  percentage: number;
}

interface ImpactHighlight {
  nonprofitName: string;
  reportTitle: string;
  reportDate: string;
  fundsUsed: number | null;
  peopleServed: number | null;
  content: string | null;
}

function getQuarterDates(quarter: number, year: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  return { start, end };
}

function getQuarterLabel(quarter: number): string {
  return `Q${quarter}`;
}

export async function generateQuarterlyReport(
  userId: string,
  quarter: number,
  year: number
): Promise<QuarterlyReportResult> {
  const supabase = createAdminClient();
  const { start, end } = getQuarterDates(quarter, year);

  console.log(`[QuarterlyReport] Generating report for Q${quarter} ${year}`);
  console.log(`[QuarterlyReport] Date range: ${start.toISOString()} to ${end.toISOString()}`);
  console.log(`[QuarterlyReport] User ID: ${userId}`);

  // First, let's check if we can see ANY donations for this user (no filters)
  const { data: allUserDonations, error: checkError } = await supabase
    .from("donations")
    .select("id, status, created_at, amount_cents")
    .eq("user_id", userId)
    .limit(5);

  console.log(`[QuarterlyReport] Check query - all user donations:`, allUserDonations?.length ?? 0);
  console.log(`[QuarterlyReport] Check query error:`, checkError);
  if (allUserDonations && allUserDonations.length > 0) {
    console.log(`[QuarterlyReport] Sample donations:`, allUserDonations);
  }

  // Get user's donations for this quarter
  const { data: donations, error: donationsError } = await supabase
    .from("donations")
    .select(`
      id,
      amount_cents,
      created_at,
      status,
      allocations (
        id,
        amount_cents,
        nonprofit_id,
        nonprofit:nonprofits (
          id,
          name,
          category:categories (
            name
          )
        )
      )
    `)
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  console.log(`[QuarterlyReport] Query error:`, donationsError);
  console.log(`[QuarterlyReport] Donations found:`, donations?.length ?? 0);
  if (donations && donations.length > 0) {
    console.log(`[QuarterlyReport] First donation:`, donations[0]);
  }

  if (donationsError || !donations || donations.length === 0) {
    // Return debug info as part of error to see on frontend
    console.log(`[QuarterlyReport] Returning null - error: ${donationsError?.message}, count: ${donations?.length}`);
    return {
      report: null,
      debug: {
        allUserDonationsCount: allUserDonations?.length ?? 0,
        filteredDonationsCount: donations?.length ?? 0,
        queryError: donationsError?.message ?? null,
        checkError: checkError?.message ?? null,
      },
    };
  }

  // Calculate totals
  const totalDonated = donations.reduce((sum, d) => sum + d.amount_cents, 0);
  const donationCount = donations.length;

  // Aggregate allocations by nonprofit
  const allocationMap = new Map<string, AllocationSummary>();

  for (const donation of donations) {
    const allocations = donation.allocations as Array<{
      id: string;
      amount_cents: number;
      nonprofit_id: string;
      nonprofit: { id: string; name: string; category: { name: string } | { name: string }[] | null } | { id: string; name: string; category: { name: string } | { name: string }[] | null }[];
    }>;

    for (const allocation of allocations || []) {
      const nonprofit = Array.isArray(allocation.nonprofit)
        ? allocation.nonprofit[0]
        : allocation.nonprofit;

      if (!nonprofit) continue;

      // Handle category which is a nested relation
      const categoryData = nonprofit.category;
      const categoryName = categoryData
        ? (Array.isArray(categoryData) ? categoryData[0]?.name : categoryData.name) || "Uncategorized"
        : "Uncategorized";

      const existing = allocationMap.get(nonprofit.id);
      if (existing) {
        existing.totalAmount += allocation.amount_cents;
        existing.donationCount += 1;
      } else {
        allocationMap.set(nonprofit.id, {
          nonprofitId: nonprofit.id,
          nonprofitName: nonprofit.name,
          category: categoryName,
          totalAmount: allocation.amount_cents,
          donationCount: 1,
          percentage: 0,
        });
      }
    }
  }

  // Calculate percentages and sort by amount
  const allocations = Array.from(allocationMap.values())
    .map((a) => ({
      ...a,
      percentage: Math.round((a.totalAmount / totalDonated) * 100),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const nonprofitsSupported = allocations.length;

  // Get impact reports from supported nonprofits during this quarter
  const nonprofitIds = allocations.map((a) => a.nonprofitId);

  const { data: impactReports } = await supabase
    .from("impact_reports")
    .select(`
      id,
      title,
      content,
      report_date,
      funds_used_cents,
      people_served,
      nonprofit:nonprofits (
        name
      )
    `)
    .in("nonprofit_id", nonprofitIds)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  const impactHighlights: ImpactHighlight[] = (impactReports || []).map((report) => {
    const nonprofit = Array.isArray(report.nonprofit)
      ? report.nonprofit[0]
      : report.nonprofit;

    return {
      nonprofitName: nonprofit?.name || "Unknown",
      reportTitle: report.title,
      reportDate: report.report_date || "",
      fundsUsed: report.funds_used_cents,
      peopleServed: report.people_served,
      content: report.content,
    };
  });

  return {
    report: {
      quarter: getQuarterLabel(quarter),
      year,
      startDate: start,
      endDate: end,
      totalDonated,
      donationCount,
      nonprofitsSupported,
      allocations,
      impactHighlights,
    },
    debug: {
      allUserDonationsCount: allUserDonations?.length ?? 0,
      filteredDonationsCount: donations?.length ?? 0,
      queryError: null,
      checkError: checkError?.message ?? null,
    },
  };
}

export function formatQuarterlyReportAsText(report: QuarterlyReportData): string {
  const lines: string[] = [];

  lines.push(`QUARTERLY IMPACT REPORT`);
  lines.push(`${report.quarter} ${report.year}`);
  lines.push(`Period: ${report.startDate.toLocaleDateString()} - ${report.endDate.toLocaleDateString()}`);
  lines.push("");
  lines.push("═".repeat(50));
  lines.push("");
  lines.push("SUMMARY");
  lines.push(`Total Donated: ${formatCurrency(report.totalDonated)}`);
  lines.push(`Number of Donations: ${report.donationCount}`);
  lines.push(`Nonprofits Supported: ${report.nonprofitsSupported}`);
  lines.push("");
  lines.push("═".repeat(50));
  lines.push("");
  lines.push("ALLOCATION BREAKDOWN");
  lines.push("");

  for (const allocation of report.allocations) {
    lines.push(`${allocation.nonprofitName}`);
    lines.push(`  Category: ${allocation.category}`);
    lines.push(`  Amount: ${formatCurrency(allocation.totalAmount)} (${allocation.percentage}%)`);
    lines.push(`  Donations: ${allocation.donationCount}`);
    lines.push("");
  }

  if (report.impactHighlights.length > 0) {
    lines.push("═".repeat(50));
    lines.push("");
    lines.push("IMPACT HIGHLIGHTS");
    lines.push("");

    for (const highlight of report.impactHighlights) {
      lines.push(`📍 ${highlight.nonprofitName}`);
      lines.push(`   "${highlight.reportTitle}"`);
      if (highlight.fundsUsed) {
        lines.push(`   Funds Used: ${formatCurrency(highlight.fundsUsed)}`);
      }
      if (highlight.peopleServed) {
        lines.push(`   People Served: ${highlight.peopleServed.toLocaleString()}`);
      }
      if (highlight.content) {
        const preview = highlight.content.substring(0, 150);
        lines.push(`   ${preview}${highlight.content.length > 150 ? "..." : ""}`);
      }
      lines.push("");
    }
  }

  lines.push("═".repeat(50));
  lines.push("");
  lines.push("Thank you for your generosity!");
  lines.push("Your donations are making a real difference.");

  return lines.join("\n");
}

export function getCurrentQuarter(): { quarter: number; year: number } {
  const now = new Date();
  const month = now.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return { quarter, year: now.getFullYear() };
}

export function getPreviousQuarter(): { quarter: number; year: number } {
  const { quarter, year } = getCurrentQuarter();
  if (quarter === 1) {
    return { quarter: 4, year: year - 1 };
  }
  return { quarter: quarter - 1, year };
}

export function getAvailableQuarters(startYear: number = 2024): Array<{ quarter: number; year: number; label: string }> {
  const quarters: Array<{ quarter: number; year: number; label: string }> = [];
  const { quarter: currentQ, year: currentY } = getCurrentQuarter();

  for (let year = startYear; year <= currentY; year++) {
    const maxQ = year === currentY ? currentQ : 4;
    for (let q = 1; q <= maxQ; q++) {
      quarters.push({
        quarter: q,
        year,
        label: `Q${q} ${year}`,
      });
    }
  }

  return quarters.reverse();
}
