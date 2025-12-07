import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TestTube } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DownloadAnnualStatementButton, PrintButton } from "./download-button";

export const metadata = {
  title: "Annual Statement",
};

interface AnnualStatementPageProps {
  params: Promise<{ year: string }>;
}

export default async function AnnualStatementPage({ params }: AnnualStatementPageProps) {
  const { year } = await params;
  const yearNum = parseInt(year, 10);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Calculate date range for the year
  const startDate = new Date(yearNum, 0, 1); // Jan 1
  const endDate = new Date(yearNum, 11, 31, 23, 59, 59); // Dec 31

  // Fetch all completed donations for this year
  const { data: donations } = await supabase
    .from("donations")
    .select(`
      *,
      allocations(
        percentage,
        amount_cents,
        nonprofit:nonprofits(name, ein),
        category:categories(name)
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", startDate.toISOString())
    .lte("completed_at", endDate.toISOString())
    .order("completed_at", { ascending: false });

  if (!donations || donations.length === 0) {
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

  // Process donations for display and PDF
  const processedDonations = donations.map((d) => {
    const recipients = (d.allocations || []).map((a: {
      nonprofit?: { name: string; ein: string | null } | null;
      category?: { name: string } | null;
    }) => a.nonprofit?.name || a.category?.name || "Unknown");

    return {
      id: d.id,
      date: formatDate(d.completed_at || d.created_at),
      amount: d.amount_cents,
      recipients,
      isSimulated: d.is_simulated || false,
    };
  });

  const totalAmount = donations.reduce((sum, d) => sum + d.amount_cents, 0);
  const hasSimulated = donations.some(d => d.is_simulated);

  const statementData = {
    year: yearNum,
    donorName,
    donorEmail: user.email || "",
    donations: processedDonations,
    totalAmount,
    totalDonations: donations.length,
    hasSimulated,
  };

  return (
    <div className="space-y-6">
      {/* Header with actions - hidden when printing */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/receipts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Receipts
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <DownloadAnnualStatementButton statementData={statementData} />
        </div>
      </div>

      {/* Simulated Badge - hidden when printing */}
      {hasSimulated && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 no-print">
          <div className="flex items-center gap-2 text-amber-800">
            <TestTube className="h-5 w-5" />
            <span className="font-medium">Includes Simulated Donations</span>
          </div>
          <p className="mt-1 text-sm text-amber-700">
            This statement includes test donations. Not for tax purposes.
          </p>
        </div>
      )}

      {/* Statement Preview - main printable content */}
      <div className={`mx-auto max-w-2xl bg-white rounded-lg border border-slate-200 shadow-sm print:shadow-none print:border-none print-content ${hasSimulated ? "simulated" : ""}`}>
        {/* Statement Header - compact for print */}
        <div className="border-b border-slate-200 p-6 print:p-4 print:pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl print:text-lg font-bold text-slate-900">DonorX</h1>
              <p className="text-xs text-slate-500">Annual Giving Statement</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Tax Year</p>
              <p className="text-xl print:text-lg font-bold text-slate-900">{yearNum}</p>
            </div>
          </div>
        </div>

        {/* Statement Body - compact spacing */}
        <div className="p-6 print:p-4 space-y-4 print:space-y-3">
          {/* Donor Info & Summary - combined row for print efficiency */}
          <div className="flex justify-between items-start gap-4 print:gap-2">
            <div className="flex-1">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Donor
              </h2>
              <p className="text-sm font-medium text-slate-900">{donorName}</p>
              <p className="text-xs text-slate-600">{user.email}</p>
            </div>
            <div className="text-right bg-emerald-50 border border-emerald-200 rounded px-3 py-2 print:px-2 print:py-1">
              <p className="text-xs text-emerald-600">{donations.length} Donations</p>
              <p className="text-lg print:text-base font-bold text-emerald-800">{formatCurrency(totalAmount)}</p>
            </div>
          </div>

          {/* Donation List - compact table */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 print:mb-1">
              Donation Details
            </h2>
            <table className="w-full text-sm print:text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-1 pr-2 font-medium text-slate-600 w-20 print:w-16">Date</th>
                  <th className="text-left py-1 px-2 font-medium text-slate-600">Recipients</th>
                  <th className="text-right py-1 pl-2 font-medium text-slate-600 w-24 print:w-20">Amount</th>
                </tr>
              </thead>
              <tbody>
                {processedDonations.map((donation) => (
                  <tr key={donation.id} className="border-b border-slate-100">
                    <td className="py-1.5 print:py-1 pr-2 text-slate-600 align-top">{donation.date}</td>
                    <td className="py-1.5 print:py-1 px-2 text-slate-900 align-top">
                      {donation.recipients.join(", ")}
                    </td>
                    <td className="py-1.5 print:py-1 pl-2 text-right font-medium text-slate-900 align-top">
                      {formatCurrency(donation.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td colSpan={2} className="py-2 print:py-1 font-bold text-slate-900">Total {yearNum}</td>
                  <td className="py-2 print:py-1 text-right font-bold text-slate-900">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tax Notice - compact */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 print:p-2 print:mt-2">
            <p className="text-xs text-slate-600 leading-relaxed print:leading-normal">
              <span className="font-semibold">Tax Deductibility Notice:</span> This statement summarizes your tax-deductible donations for {yearNum}. No goods or services were provided in exchange for these contributions. Please retain for your tax records.
            </p>
          </div>
        </div>

        {/* Statement Footer - minimal */}
        <div className="border-t border-slate-200 px-6 py-3 print:px-4 print:py-2 text-center">
          <p className="text-xs text-slate-500">
            DonorX • Tax ID: XX-XXXXXXX • Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
