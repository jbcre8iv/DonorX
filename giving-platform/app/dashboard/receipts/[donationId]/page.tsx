import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TestTube } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DownloadReceiptButton, PrintButton } from "./download-button";

export const metadata = {
  title: "Donation Receipt",
};

interface ReceiptPageProps {
  params: Promise<{ donationId: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { donationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch donation with allocations
  const { data: donation } = await supabase
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
    .eq("id", donationId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .single();

  if (!donation) {
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

  const allocations = (donation.allocations || []).map((a: {
    nonprofit?: { name: string; ein: string | null } | null;
    category?: { name: string } | null;
    amount_cents: number;
    percentage: number;
  }) => ({
    name: a.nonprofit?.name || a.category?.name || "Unknown",
    ein: a.nonprofit?.ein || null,
    amount: a.amount_cents,
    percentage: a.percentage,
  }));

  const receiptData = {
    donationId: donation.id,
    donorName,
    donorEmail: user.email || "",
    amount: donation.amount_cents,
    date: formatDate(donation.completed_at || donation.created_at),
    allocations,
    isSimulated: donation.is_simulated || false,
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
          <DownloadReceiptButton receiptData={receiptData} />
        </div>
      </div>

      {/* Simulated Badge - hidden when printing */}
      {donation.is_simulated && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 no-print">
          <div className="flex items-center gap-2 text-amber-800">
            <TestTube className="h-5 w-5" />
            <span className="font-medium">Simulated Donation Receipt</span>
          </div>
          <p className="mt-1 text-sm text-amber-700">
            This is a test receipt. No real payment was processed.
          </p>
        </div>
      )}

      {/* Receipt Preview - main printable content */}
      <div className={`mx-auto max-w-2xl bg-white rounded-lg border border-slate-200 shadow-sm print:shadow-none print:border-none print-content ${donation.is_simulated ? "simulated" : ""}`}>
        {/* Receipt Header */}
        <div className="border-b border-slate-200 p-8 print:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">DonorX</h1>
              <p className="text-sm text-slate-500">Tax-Deductible Donation Receipt</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Receipt #</p>
              <p className="font-mono font-semibold text-slate-900">
                {donation.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
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

          {/* Donation Details */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Donation Details
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Date</span>
                <span className="font-medium text-slate-900">
                  {formatDate(donation.completed_at || donation.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Method</span>
                <span className="font-medium text-slate-900">
                  {donation.is_simulated ? "Simulated" : "Credit Card"}
                </span>
              </div>
            </div>
          </div>

          {/* Allocations */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Allocation Breakdown
            </h2>
            <div className="space-y-2">
              {allocations.map((allocation: { name: string; ein: string | null; amount: number; percentage: number }, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">{allocation.name}</p>
                    {allocation.ein && (
                      <p className="text-xs text-slate-500">EIN: {allocation.ein}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(allocation.amount)}
                    </p>
                    <p className="text-xs text-slate-500">{allocation.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t-2 border-slate-900 flex justify-between">
              <span className="text-lg font-bold text-slate-900">Total Donation</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(donation.amount_cents)}
              </span>
            </div>
          </div>

          {/* Tax Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-800 mb-2">
              Tax Deductibility Notice
            </h3>
            <p className="text-sm text-emerald-700">
              This receipt confirms your tax-deductible donation. No goods or services
              were provided in exchange for this contribution. Please retain this
              receipt for your tax records. For donations over $250, this serves as
              your written acknowledgment as required by the IRS.
            </p>
          </div>
        </div>

        {/* Receipt Footer */}
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
