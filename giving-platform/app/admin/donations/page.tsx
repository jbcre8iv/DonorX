import Link from "next/link";
import { Download, Search, Eye, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Manage Donations",
};

export default async function AdminDonationsPage() {
  const supabase = await createClient();

  // Fetch all donations with user and organization info
  const { data: donationData } = await supabase
    .from("donations")
    .select(`
      id,
      amount_cents,
      status,
      created_at,
      completed_at,
      user:users(
        id,
        full_name,
        organization:organizations(name)
      ),
      allocations(id)
    `)
    .order("created_at", { ascending: false });

  // Map donations with proper typing
  const donations = (donationData || []).map((d: Record<string, unknown>) => {
    const user = Array.isArray(d.user) ? d.user[0] : d.user;
    const org = user?.organization;
    const orgName = Array.isArray(org) ? org[0]?.name : org?.name;
    const allocations = d.allocations as Array<{ id: string }> | null;

    return {
      id: d.id as string,
      amount_cents: d.amount_cents as number,
      status: d.status as string,
      created_at: d.created_at as string,
      completed_at: d.completed_at as string | null,
      user_name: user?.full_name || "Unknown",
      org_name: orgName || "No Organization",
      allocation_count: allocations?.length || 0,
    };
  });

  // Calculate summary stats
  const completedDonations = donations.filter((d) => d.status === "completed");
  const totalAmount = completedDonations.reduce((sum, d) => sum + d.amount_cents, 0);

  // This month's total
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTotal = completedDonations
    .filter((d) => new Date(d.completed_at || d.created_at) >= thisMonthStart)
    .reduce((sum, d) => sum + d.amount_cents, 0);

  // Processing donations
  const processingTotal = donations
    .filter((d) => d.status === "processing" || d.status === "pending")
    .reduce((sum, d) => sum + d.amount_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-purple-900">Donations</h1>
          <p className="text-purple-700/70">View and manage all donations</p>
        </div>
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total Donations</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {completedDonations.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total Amount</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Processing</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">
              {formatCurrency(processingTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">This Month</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {formatCurrency(thisMonthTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Donations ({donations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No donations yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Donations will appear here once users start donating
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Donor</th>
                    <th className="pb-3 font-medium">Organization</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-center">Allocations</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {donations.map((donation) => (
                    <tr key={donation.id} className="text-sm">
                      <td className="py-4 font-mono text-xs text-slate-500">
                        {donation.id.slice(0, 8)}...
                      </td>
                      <td className="py-4">
                        <p className="font-medium text-slate-900">
                          {donation.user_name}
                        </p>
                      </td>
                      <td className="py-4 text-slate-600">
                        {donation.org_name}
                      </td>
                      <td className="py-4 text-slate-600">
                        {formatDate(donation.completed_at || donation.created_at)}
                      </td>
                      <td className="py-4 text-right font-semibold text-slate-900">
                        {formatCurrency(donation.amount_cents)}
                      </td>
                      <td className="py-4 text-center text-slate-600">
                        {donation.allocation_count}
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            donation.status === "completed"
                              ? "success"
                              : donation.status === "processing" ||
                                donation.status === "pending"
                              ? "warning"
                              : "destructive"
                          }
                        >
                          {donation.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/history/${donation.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
