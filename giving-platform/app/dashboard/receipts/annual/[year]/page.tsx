import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TestTube, Calendar } from "lucide-react";
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
        {/* Statement Header */}
        <div className="border-b border-slate-200 p-8 print:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">DonorX</h1>
              <p className="text-sm text-slate-500">Annual Giving Statement</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Tax Year</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{yearNum}</p>
            </div>
          </div>
        </div>

        {/* Statement Body */}
        <div className="p-8 print:p-6 space-y-8">
          {/* Donor Info */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Donor Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Name</span>
                <span className="font-medium text-slate-900">{donorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Email</span>
                <span className="font-medium text-slate-900">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Annual Summary */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-emerald-800 mb-3">
              Annual Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-emerald-600">Total Donations</p>
                <p className="text-2xl font-bold text-emerald-800">{donations.length}</p>
              </div>
              <div>
                <p className="text-sm text-emerald-600">Total Amount</p>
                <p className="text-2xl font-bold text-emerald-800">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Donation List */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Donation Details
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left px-3 py-2 font-medium text-slate-600 w-[70px]">Date</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Recipients</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-600 w-[90px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {processedDonations.map((donation) => (
                  <tr key={donation.id} className="bg-slate-50 border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-600 align-top">{donation.date}</td>
                    <td className="px-3 py-2 text-slate-900 align-top">{donation.recipients.join(", ")}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 align-top whitespace-nowrap">
                      {formatCurrency(donation.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td colSpan={2} className="px-3 py-3 text-lg font-bold text-slate-900">Total {yearNum}</td>
                  <td className="px-3 py-3 text-right text-lg font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tax Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-800 mb-2">
              Tax Deductibility Notice
            </h3>
            <p className="text-sm text-emerald-700">
              This statement summarizes your tax-deductible donations for the {yearNum} tax year.
              No goods or services were provided in exchange for these contributions. Please retain
              this statement for your tax records. For donations over $250, individual receipts are
              available and serve as written acknowledgment as required by the IRS.
            </p>
          </div>
        </div>

        {/* Statement Footer */}
        <div className="border-t border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-500">
            DonorX • Tax ID: XX-XXXXXXX • support@donorx.com
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
