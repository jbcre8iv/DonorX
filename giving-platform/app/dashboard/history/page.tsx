import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Download, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { HistoryFilters } from "./history-filters";

export const metadata = {
  title: "Donation History",
};

interface HistoryPageProps {
  searchParams: Promise<{ status?: string; year?: string }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Build query
  let query = supabase
    .from("donations")
    .select(`
      *,
      allocations(
        percentage,
        amount_cents,
        nonprofit:nonprofits(id, name),
        category:categories(id, name)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Apply status filter
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  // Apply year filter
  if (params.year && params.year !== "all") {
    const yearStart = new Date(`${params.year}-01-01`).toISOString();
    const yearEnd = new Date(`${parseInt(params.year) + 1}-01-01`).toISOString();
    query = query.gte("created_at", yearStart).lt("created_at", yearEnd);
  }

  const { data: donations } = await query;

  const allDonations = donations || [];

  // Get available years for filter
  const years = [...new Set(allDonations.map((d) =>
    new Date(d.created_at).getFullYear()
  ))].sort((a, b) => b - a);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
      case "processing":
        return "default";
      case "failed":
      case "refunded":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Donation History
        </h1>
        <p className="text-slate-600">View and manage your past donations</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <HistoryFilters years={years} />
        </CardContent>
      </Card>

      {/* Donations List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {allDonations.length} Donation{allDonations.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allDonations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No donations found.</p>
              <Button asChild className="mt-4">
                <Link href="/donate">Make a Donation</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {allDonations.map((donation) => {
                const recipients = donation.allocations?.map(
                  (a: {
                    nonprofit?: { id: string; name: string } | null;
                    category?: { id: string; name: string } | null;
                  }) => a.nonprofit?.name || a.category?.name || "Unknown"
                );

                return (
                  <div
                    key={donation.id}
                    className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          donation.status === "completed"
                            ? "bg-emerald-100"
                            : donation.status === "pending" ||
                              donation.status === "processing"
                            ? "bg-amber-100"
                            : "bg-red-100"
                        }`}
                      >
                        <CreditCard
                          className={`h-5 w-5 ${
                            donation.status === "completed"
                              ? "text-emerald-600"
                              : donation.status === "pending" ||
                                donation.status === "processing"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(donation.amount_cents)}
                          </p>
                          <Badge variant={getStatusVariant(donation.status)}>
                            {donation.status.charAt(0).toUpperCase() +
                              donation.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(donation.created_at)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {recipients?.slice(0, 3).map((recipient: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {recipient}
                            </span>
                          ))}
                          {recipients && recipients.length > 3 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              +{recipients.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col sm:items-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/history/${donation.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                      {donation.status === "completed" && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/receipts/${donation.id}`}>
                            <Download className="mr-2 h-4 w-4" />
                            Receipt
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
