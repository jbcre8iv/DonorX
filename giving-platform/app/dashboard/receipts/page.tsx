import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, FileText, Calendar, CreditCard, TestTube, Eye } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { config } from "@/lib/config";

export const metadata = {
  title: "Tax Receipts",
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

export default async function ReceiptsPage() {
  const supabase = await createClient();
  const simulationMode = await isSimulationMode();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch completed donations
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
    .order("completed_at", { ascending: false });

  const completedDonations = donations || [];

  // Calculate annual stats
  const currentYear = new Date().getFullYear();
  const thisYearDonations = completedDonations.filter(
    (d) => new Date(d.completed_at || d.created_at).getFullYear() === currentYear
  );
  const totalThisYear = thisYearDonations.reduce((sum, d) => sum + d.amount_cents, 0);

  // Group by year for annual summary
  const donationsByYear = completedDonations.reduce((acc, d) => {
    const year = new Date(d.completed_at || d.created_at).getFullYear();
    if (!acc[year]) {
      acc[year] = { donations: [], total: 0 };
    }
    acc[year].donations.push(d);
    acc[year].total += d.amount_cents;
    return acc;
  }, {} as Record<number, { donations: typeof completedDonations; total: number }>);

  const years = Object.keys(donationsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Tax Receipts</h1>
        <p className="text-slate-600">
          Download your tax-deductible donation receipts
        </p>
      </div>

      {/* Annual Summary */}
      {thisYearDonations.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  {currentYear} Year-to-Date
                </p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">
                  {formatCurrency(totalThisYear)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {thisYearDonations.length} donation{thisYearDonations.length !== 1 ? "s" : ""}
                </p>
              </div>
              {simulationMode ? (
                <Button size="lg" asChild>
                  <Link href={`/dashboard/receipts/annual/${currentYear}`}>
                    <Eye className="mr-2 h-5 w-5" />
                    View Annual Statement
                  </Link>
                </Button>
              ) : (
                <Button size="lg" disabled>
                  <Download className="mr-2 h-5 w-5" />
                  Annual Statement (Available Jan 15)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Donation Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {completedDonations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No completed donations yet.</p>
              <p className="text-sm text-slate-400 mt-1">
                Receipts will appear here after your donations are processed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedDonations.map((donation) => {
                const recipients = donation.allocations?.map(
                  (a: {
                    nonprofit?: { name: string; ein: string | null } | null;
                    category?: { name: string } | null;
                  }) => a.nonprofit?.name || a.category?.name
                );

                return (
                  <div
                    key={donation.id}
                    className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                        <CreditCard className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(donation.amount_cents)}
                          </p>
                          <Badge variant="success">Tax Deductible</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(donation.completed_at || donation.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 truncate max-w-xs">
                          {recipients?.slice(0, 2).join(", ")}
                          {recipients && recipients.length > 2 && ` +${recipients.length - 2} more`}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/receipts/${donation.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Receipt
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Year Summary Cards */}
      {years.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Annual Summaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {years.map((year) => (
                <div
                  key={year}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{year}</p>
                      <p className="text-sm text-slate-500">
                        {donationsByYear[year].donations.length} donation{donationsByYear[year].donations.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mb-3">
                    {formatCurrency(donationsByYear[year].total)}
                  </p>
                  {year === currentYear && !simulationMode ? (
                    <Button variant="outline" size="sm" fullWidth disabled>
                      <Download className="mr-2 h-4 w-4" />
                      Available Jan 15
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" fullWidth asChild>
                      <Link href={`/dashboard/receipts/annual/${year}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Statement
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              All donations made through {config.appName} are tax-deductible to the extent
              allowed by law. Each receipt includes the EIN of the recipient
              nonprofit organization(s).
            </p>
            <p className="mt-2">
              For donations over $250, this receipt serves as your written
              acknowledgment as required by the IRS. Please consult with your tax
              advisor for specific guidance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
