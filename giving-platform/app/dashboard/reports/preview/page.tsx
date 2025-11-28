import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TestTube, Calendar, DollarSign, Building2, TrendingUp } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  generateQuarterlyReport,
} from "@/lib/reports/quarterly-generator";
import { DownloadQuarterlyReportButton, PrintButton } from "./download-button";

export const metadata = {
  title: "Quarterly Report Preview",
};

interface QuarterlyReportPreviewPageProps {
  searchParams: Promise<{ quarter?: string; year?: string }>;
}

export default async function QuarterlyReportPreviewPage({
  searchParams,
}: QuarterlyReportPreviewPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parse quarter and year
  const quarter = params.quarter ? parseInt(params.quarter, 10) : 4;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

  // Generate the report
  const report = await generateQuarterlyReport(user.id, quarter, year);

  if (!report) {
    notFound();
  }

  // Get user profile for name
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .single();

  const donorName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.email || user.email || "Donor";

  // Check if any allocations are from simulated donations
  // Note: We would need to extend the report generator to track this
  const hasSimulated = false; // Placeholder - would need to be tracked

  const reportData = {
    quarter,
    year,
    donorName,
    donorEmail: user.email || "",
    startDate: report.startDate.toLocaleDateString(),
    endDate: report.endDate.toLocaleDateString(),
    totalDonated: report.totalDonated,
    donationCount: report.donationCount,
    nonprofitsSupported: report.nonprofitsSupported,
    allocations: report.allocations,
    impactHighlights: report.impactHighlights.map(h => ({
      ...h,
      content: h.content ?? undefined,
      reportDate: h.reportDate ?? undefined,
      fundsUsed: h.fundsUsed ?? undefined,
      peopleServed: h.peopleServed ?? undefined,
    })),
    hasSimulated,
  };

  const quarterLabel = `Q${quarter} ${year}`;

  return (
    <div className="space-y-6">
      {/* Header with actions - hidden when printing */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <DownloadQuarterlyReportButton reportData={reportData} />
        </div>
      </div>

      {/* Report Preview - main printable content */}
      <div className="mx-auto max-w-3xl bg-white rounded-lg border border-slate-200 shadow-sm print:shadow-none print:border-none print-content">
        {/* Report Header */}
        <div className="border-b border-slate-200 p-8 print:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">DonorX</h1>
              <p className="text-sm text-slate-500">Quarterly Impact Report</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Quarter</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{quarterLabel}</p>
            </div>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-8 print:p-6 space-y-8">
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Donated</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
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
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Donations Made</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {report.donationCount}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <TrendingUp className="h-5 w-5 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Nonprofits</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {report.nonprofitsSupported}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Building2 className="h-5 w-5 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date Range */}
          <div className="text-center text-sm text-slate-500">
            Report Period: {report.startDate.toLocaleDateString()} - {report.endDate.toLocaleDateString()}
          </div>

          {/* Allocation Breakdown */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Allocation Breakdown
            </h2>
            <div className="space-y-3">
              {report.allocations.map((allocation) => (
                <div key={allocation.nonprofitId}>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{allocation.nonprofitName}</p>
                      <p className="text-sm text-slate-500">{allocation.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(allocation.totalAmount)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {allocation.percentage}%
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${allocation.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact Highlights */}
          {report.impactHighlights.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Impact Highlights
              </h2>
              <div className="space-y-4">
                {report.impactHighlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-emerald-800">{highlight.reportTitle}</p>
                        <p className="text-sm text-emerald-600">{highlight.nonprofitName}</p>
                      </div>
                      {highlight.reportDate && (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                          {highlight.reportDate}
                        </Badge>
                      )}
                    </div>
                    {highlight.content && (
                      <p className="text-sm text-emerald-700 line-clamp-3">{highlight.content}</p>
                    )}
                    <div className="flex gap-4 mt-3 text-sm">
                      {highlight.fundsUsed && (
                        <span className="text-emerald-600">
                          <DollarSign className="inline h-3 w-3" />
                          {formatCurrency(highlight.fundsUsed)} used
                        </span>
                      )}
                      {highlight.peopleServed && (
                        <span className="text-emerald-600">
                          {highlight.peopleServed.toLocaleString()} people served
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Report Footer */}
        <div className="border-t border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-500">
            DonorX • {quarterLabel} Impact Report • {donorName}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Generated on {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
