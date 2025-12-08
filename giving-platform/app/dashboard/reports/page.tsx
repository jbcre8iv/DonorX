import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Download, Calendar, DollarSign, Building2, TrendingUp, Eye } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  generateQuarterlyReport,
  getAvailableQuarters,
  formatQuarterlyReportAsText,
} from "@/lib/reports/quarterly-generator";
import { formatCurrency } from "@/lib/utils";
import { DebugDonations } from "./debug-donations";

export const metadata = {
  title: "Quarterly Reports",
};

async function isSimulationMode(): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("system_settings")
      .select("value")
      .eq("key", "simulation_mode")
      .single();
    return data?.value?.enabled === true;
  } catch {
    return false;
  }
}

export default async function QuarterlyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string; year?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const simulationMode = await isSimulationMode();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get available quarters
  const availableQuarters = getAvailableQuarters(2024);

  // Parse selected quarter or use most recent
  let selectedQuarter = availableQuarters[0]?.quarter || 1;
  let selectedYear = availableQuarters[0]?.year || 2024;

  if (params.quarter && params.year) {
    selectedQuarter = parseInt(params.quarter, 10);
    selectedYear = parseInt(params.year, 10);
  }

  // Generate report for selected quarter
  let report = null;
  let reportError: string | null = null;
  let serverDebug: { allUserDonationsCount: number; filteredDonationsCount: number; queryError: string | null; checkError: string | null } | null = null;
  try {
    const result = await generateQuarterlyReport(user.id, selectedQuarter, selectedYear);
    report = result.report;
    serverDebug = result.debug;
  } catch (err) {
    reportError = err instanceof Error ? err.message : String(err);
    console.error("[Reports Page] Error generating report:", err);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Quarterly Impact Reports</h1>
          <p className="text-slate-600">Review your giving impact by quarter</p>
        </div>
      </div>

      {/* Quarter Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Quarter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableQuarters.map((q) => {
              const isSelected = q.quarter === selectedQuarter && q.year === selectedYear;
              return (
                <Link
                  key={`${q.quarter}-${q.year}`}
                  href={`/dashboard/reports?quarter=${q.quarter}&year=${q.year}`}
                >
                  <Badge
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-2 ${
                      isSelected ? "" : "hover:bg-slate-100"
                    }`}
                  >
                    {q.label}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Debug Info - remove after fixing */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 text-sm font-mono">
          <p className="font-bold text-amber-800 mb-2">Debug Info:</p>
          <p>Selected: Q{selectedQuarter} {selectedYear}</p>
          <p>User ID: {user.id}</p>
          <p>Report found: {report ? "Yes" : "No"}</p>
          {reportError && <p className="text-red-600">Error: {reportError}</p>}
          {serverDebug && (
            <div className="mt-2 pt-2 border-t border-amber-300">
              <p className="font-bold">Server Query Debug:</p>
              <p>All user donations (admin client): {serverDebug.allUserDonationsCount}</p>
              <p>Filtered Q{selectedQuarter} donations: {serverDebug.filteredDonationsCount}</p>
              {serverDebug.checkError && <p className="text-red-600">Check error: {serverDebug.checkError}</p>}
              {serverDebug.queryError && <p className="text-red-600">Query error: {serverDebug.queryError}</p>}
            </div>
          )}
          {report && (
            <>
              <p>Donations: {report.donationCount}</p>
              <p>Total: ${(report.totalDonated / 100).toFixed(2)}</p>
            </>
          )}
          <DebugDonations userId={user.id} quarter={selectedQuarter} year={selectedYear} />
        </CardContent>
      </Card>

      {/* Report Content */}
      {report ? (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Donated</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {formatCurrency(report.totalDonated)}
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
                      {report.donationCount}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <FileText className="h-5 w-5 text-blue-700" />
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
                      {report.nonprofitsSupported}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Building2 className="h-5 w-5 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Impact Updates</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {report.impactHighlights.length}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <TrendingUp className="h-5 w-5 text-amber-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allocation Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Allocation Breakdown</CardTitle>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                {report.startDate.toLocaleDateString()} - {report.endDate.toLocaleDateString()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.allocations.map((allocation) => (
                  <div
                    key={allocation.nonprofitId}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{allocation.nonprofitName}</p>
                      <p className="text-sm text-slate-500">{allocation.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(allocation.totalAmount)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {allocation.percentage}% • {allocation.donationCount} donation
                        {allocation.donationCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual Bar Chart */}
              <div className="mt-6 space-y-2">
                {report.allocations.slice(0, 5).map((allocation) => (
                  <div key={allocation.nonprofitId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 truncate max-w-[200px]">
                        {allocation.nonprofitName}
                      </span>
                      <span className="text-slate-900 font-medium">{allocation.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${allocation.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Impact Highlights */}
          {report.impactHighlights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Impact Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.impactHighlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-slate-200 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{highlight.reportTitle}</p>
                          <p className="text-sm text-slate-500">{highlight.nonprofitName}</p>
                        </div>
                        {highlight.reportDate && (
                          <Badge variant="outline">{highlight.reportDate}</Badge>
                        )}
                      </div>
                      {highlight.content && (
                        <p className="text-sm text-slate-600 line-clamp-3">{highlight.content}</p>
                      )}
                      <div className="flex gap-4 text-sm">
                        {highlight.fundsUsed && (
                          <span className="text-emerald-600">
                            <DollarSign className="inline h-3 w-3" />
                            {formatCurrency(highlight.fundsUsed)} used
                          </span>
                        )}
                        {highlight.peopleServed && (
                          <span className="text-blue-600">
                            {highlight.peopleServed.toLocaleString()} people served
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* View Full Report */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Full Impact Report</p>
                  <p className="text-sm text-slate-500">
                    View and download a detailed report for your records
                  </p>
                </div>
                {simulationMode ? (
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/reports/preview?quarter=${selectedQuarter}&year=${selectedYear}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Report
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF (Coming Soon)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No donations in this quarter</p>
              <p className="text-sm text-slate-400 mt-1">
                Select a different quarter or make a donation to see your impact report
              </p>
              <Button className="mt-4" asChild>
                <Link href="/donate">Make a Donation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
