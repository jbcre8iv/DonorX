"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Donation {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string;
  recipients: string[];
}

interface RecentDonationsCompactProps {
  donations: Donation[];
}

export function RecentDonationsCompact({ donations }: RecentDonationsCompactProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-base font-semibold">Recent Donations</CardTitle>
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
          <Link href="/dashboard/history">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {donations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">No donations yet.</p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/donate">Make Your First Donation</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                      donation.status === "completed"
                        ? "bg-emerald-100"
                        : donation.status === "pending"
                        ? "bg-amber-100"
                        : "bg-red-100"
                    }`}
                  >
                    <CreditCard
                      className={`h-3.5 w-3.5 ${
                        donation.status === "completed"
                          ? "text-emerald-600"
                          : donation.status === "pending"
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-900">
                        {formatCurrency(donation.amount_cents)}
                      </span>
                      <Badge
                        variant={
                          donation.status === "completed"
                            ? "success"
                            : donation.status === "pending"
                            ? "default"
                            : "destructive"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {donation.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {donation.recipients.slice(0, 2).join(", ")}
                      {donation.recipients.length > 2 && ` +${donation.recipients.length - 2}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                  {formatDate(donation.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
