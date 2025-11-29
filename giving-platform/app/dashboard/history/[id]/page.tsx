import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, Building2, Tag, CheckCircle, Clock, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CompleteButton } from "./complete-button";

interface DonationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DonationDetailPageProps) {
  return { title: "Donation Details" };
}

export default async function DonationDetailPage({ params }: DonationDetailPageProps) {
  const { id } = await params;
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
        id,
        percentage,
        amount_cents,
        disbursed,
        disbursed_at,
        nonprofit:nonprofits(id, name, logo_url),
        category:categories(id, name, icon)
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!donation) {
    notFound();
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "pending":
      case "processing":
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
      case "processing":
        return "default";
      default:
        return "destructive";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/history"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to History
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              Donation Details
            </h1>
            <Badge variant={getStatusVariant(donation.status)}>
              {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
            </Badge>
          </div>
          <p className="text-slate-600 mt-1">
            {formatDate(donation.created_at)}
          </p>
        </div>
        {donation.status === "completed" && (
          <Button asChild>
            <Link href={`/dashboard/receipts?donation=${donation.id}`}>
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <Card>
            <CardHeader>
              <CardTitle>Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">
                {formatCurrency(donation.amount_cents)}
              </div>
              <p className="text-slate-500 mt-1">
                Tax-deductible donation
              </p>
            </CardContent>
          </Card>

          {/* Allocations */}
          <Card>
            <CardHeader>
              <CardTitle>Allocation Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donation.allocations?.map((allocation: {
                  id: string;
                  percentage: number;
                  amount_cents: number;
                  disbursed: boolean;
                  disbursed_at: string | null;
                  nonprofit?: { id: string; name: string; logo_url: string | null } | null;
                  category?: { id: string; name: string; icon: string | null } | null;
                }) => (
                  <div
                    key={allocation.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      {allocation.nonprofit ? (
                        <>
                          {allocation.nonprofit.logo_url ? (
                            <img
                              src={allocation.nonprofit.logo_url}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900">
                              {allocation.nonprofit.name}
                            </p>
                            <p className="text-sm text-slate-500">Nonprofit</p>
                          </div>
                        </>
                      ) : allocation.category ? (
                        <>
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-lg">
                            {allocation.category.icon || <Tag className="h-5 w-5 text-purple-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {allocation.category.name}
                            </p>
                            <p className="text-sm text-slate-500">Category</p>
                          </div>
                        </>
                      ) : (
                        <div>
                          <p className="font-medium text-slate-900">Unknown</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(allocation.amount_cents)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {allocation.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {getStatusIcon(donation.status)}
                <div>
                  <p className="font-medium text-slate-900">
                    {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {donation.status === "completed"
                      ? `Completed ${formatDate(donation.completed_at)}`
                      : donation.status === "pending"
                      ? "Awaiting payment"
                      : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Donation ID</p>
                <p className="font-mono text-sm text-slate-900">
                  {donation.id.slice(0, 8)}...
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p className="text-slate-900">
                  {formatDate(donation.created_at)}
                </p>
              </div>
              {donation.stripe_charge_id && (
                <div>
                  <p className="text-sm text-slate-500">Payment Reference</p>
                  <p className="font-mono text-sm text-slate-900">
                    {donation.stripe_charge_id.slice(0, 20)}...
                  </p>
                </div>
              )}
              {donation.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="text-slate-900">{donation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {/* Mark as Complete button for pending simulated donations */}
              {donation.status === "pending" && donation.is_simulated && (
                <CompleteButton donationId={donation.id} />
              )}
              {donation.status === "completed" && (
                <Button variant="outline" fullWidth asChild>
                  <Link href={`/dashboard/receipts/${donation.id}`}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Receipt
                  </Link>
                </Button>
              )}
              <Button variant="ghost" fullWidth asChild>
                <Link href="/donate">Make Another Donation</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
