import { redirect } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Calendar, DollarSign, Pause, Play, XCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Recurring Donations",
};

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch recurring donations
  const { data: recurringDonations } = await supabase
    .from("donations")
    .select(`
      id,
      amount_cents,
      recurring_interval,
      status,
      created_at,
      stripe_subscription_id,
      allocations(
        percentage,
        nonprofit:nonprofits(name),
        category:categories(name)
      )
    `)
    .eq("user_id", user.id)
    .eq("is_recurring", true)
    .order("created_at", { ascending: false });

  // Map the donations with proper types
  const subscriptions = (recurringDonations || []).map((d: Record<string, unknown>) => {
    const allocations = (d.allocations as Array<Record<string, unknown>>) || [];
    return {
      id: d.id as string,
      amount_cents: d.amount_cents as number,
      interval: d.recurring_interval as string,
      status: d.status as string,
      created_at: d.created_at as string,
      stripe_subscription_id: d.stripe_subscription_id as string | null,
      recipients: allocations.map((a) => {
        const nonprofit = Array.isArray(a.nonprofit) ? a.nonprofit[0] : a.nonprofit;
        const category = Array.isArray(a.category) ? a.category[0] : a.category;
        return nonprofit?.name || category?.name || "Unknown";
      }),
    };
  });

  const activeSubscriptions = subscriptions.filter((s) => s.status === "completed");
  const totalMonthly = activeSubscriptions
    .filter((s) => s.interval === "monthly")
    .reduce((sum, s) => sum + s.amount_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Recurring Donations
          </h1>
          <p className="text-slate-600">
            Manage your ongoing donation commitments
          </p>
        </div>
        <Button asChild>
          <Link href="/donate">
            <Plus className="mr-2 h-4 w-4" />
            New Recurring Donation
          </Link>
        </Button>
      </div>

      {/* Summary */}
      {activeSubscriptions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <RefreshCw className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Active Subscriptions</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {activeSubscriptions.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <DollarSign className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Monthly Total</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {formatCurrency(totalMonthly)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Calendar className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Organizations</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {new Set(activeSubscriptions.flatMap((s) => s.recipients)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recurring Donations</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No recurring donations yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Set up a recurring donation to make a lasting impact
              </p>
              <Button className="mt-4" asChild>
                <Link href="/donate">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Recurring Donation
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-200 p-4 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <RefreshCw className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(sub.amount_cents)}
                          <span className="text-sm font-normal text-slate-500">
                            /{sub.interval === "monthly" ? "mo" : sub.interval === "quarterly" ? "qtr" : "yr"}
                          </span>
                        </p>
                        <Badge
                          variant={
                            sub.status === "completed"
                              ? "success"
                              : sub.status === "pending"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {sub.status === "completed" ? "Active" : sub.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {sub.recipients.slice(0, 2).join(", ")}
                        {sub.recipients.length > 2 && ` +${sub.recipients.length - 2} more`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Started {formatDate(sub.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <Button variant="outline" size="sm" disabled>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      disabled
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-1">
              About Recurring Donations
            </h3>
            <p className="text-sm text-blue-700">
              Recurring donations are processed automatically on your billing date.
              You can pause or cancel anytime, and you&apos;ll receive a single consolidated
              tax receipt at the end of each year.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
