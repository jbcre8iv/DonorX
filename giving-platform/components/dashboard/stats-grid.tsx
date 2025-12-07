"use client";

import { useState, useRef, useEffect } from "react";
import { CreditCard, TrendingUp, Building2, FileText, X, Calendar, DollarSign, ArrowRight } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface RecentDonation {
  id: string;
  amount_cents: number;
  created_at: string;
  recipients: string[];
}

interface NonprofitSummary {
  name: string;
  amount: number;
  donationCount: number;
}

interface ReceiptSummary {
  year: number;
  count: number;
  total: number;
}

interface StatsGridProps {
  totalDonated: number;
  donationsCount: number;
  nonprofitsCount: number;
  receiptsCount: number;
  subtitleTotal: string;
  subtitleDonations: string;
  // Detail data for flyouts
  recentDonations?: RecentDonation[];
  nonprofitSummaries?: NonprofitSummary[];
  receiptSummaries?: ReceiptSummary[];
  averageDonation?: number;
  largestDonation?: number;
  lastDonationDate?: string | null;
}

function StatFlyout({
  isOpen,
  onClose,
  children,
  title,
  containerRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Don't close if clicking inside the flyout or the parent card container
      if (flyoutRef.current?.contains(target) || containerRef.current?.contains(target)) {
        return;
      }
      onClose();
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, containerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={flyoutRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 max-h-[300px] overflow-y-auto">{children}</div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StatsGrid({
  totalDonated,
  donationsCount,
  nonprofitsCount,
  receiptsCount,
  subtitleTotal,
  subtitleDonations,
  recentDonations = [],
  nonprofitSummaries = [],
  receiptSummaries = [],
  averageDonation = 0,
  largestDonation = 0,
  lastDonationDate,
}: StatsGridProps) {
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);
  const donationsRef = useRef<HTMLDivElement>(null);
  const nonprofitsRef = useRef<HTMLDivElement>(null);
  const receiptsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Donated - Not clickable */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600">Total Donated</p>
              <p className="mt-0.5 text-xl font-semibold text-slate-900">
                <AnimatedNumber value={totalDonated} format="currency" />
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <TrendingUp className="h-4 w-4 text-blue-700" />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">{subtitleTotal}</p>
        </CardContent>
      </Card>

      {/* Donations - Clickable */}
      <div className="relative" ref={donationsRef}>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setOpenFlyout(openFlyout === "donations" ? null : "donations")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Donations</p>
                <p className="mt-0.5 text-xl font-semibold text-slate-900">
                  <AnimatedNumber value={donationsCount} format="number" />
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                <CreditCard className="h-4 w-4 text-emerald-700" />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">{subtitleDonations}</p>
          </CardContent>
        </Card>
        <StatFlyout
          isOpen={openFlyout === "donations"}
          onClose={() => setOpenFlyout(null)}
          title="Donation Insights"
          containerRef={donationsRef}
        >
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Average</p>
                <p className="font-semibold text-slate-900">{formatCurrency(averageDonation)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Largest</p>
                <p className="font-semibold text-slate-900">{formatCurrency(largestDonation)}</p>
              </div>
            </div>

            {/* Recent Donations */}
            {recentDonations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Recent Donations</p>
                <div className="space-y-2">
                  {recentDonations.slice(0, 3).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 truncate">
                          {formatDate(donation.created_at)}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 ml-2">
                        {formatCurrency(donation.amount_cents / 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastDonationDate && (
              <p className="text-xs text-slate-500">
                Last donation: {formatDate(lastDonationDate)}
              </p>
            )}

            <Link
              href="/dashboard/history"
              className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
            >
              View all donations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </StatFlyout>
      </div>

      {/* Nonprofits Supported - Clickable */}
      <div className="relative" ref={nonprofitsRef}>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setOpenFlyout(openFlyout === "nonprofits" ? null : "nonprofits")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Nonprofits Supported</p>
                <p className="mt-0.5 text-xl font-semibold text-slate-900">
                  <AnimatedNumber value={nonprofitsCount} format="number" />
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                <Building2 className="h-4 w-4 text-purple-700" />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">Organizations</p>
          </CardContent>
        </Card>
        <StatFlyout
          isOpen={openFlyout === "nonprofits"}
          onClose={() => setOpenFlyout(null)}
          title="Nonprofits Supported"
          containerRef={nonprofitsRef}
        >
          <div className="space-y-3">
            {nonprofitSummaries.length > 0 ? (
              <>
                {nonprofitSummaries.slice(0, 5).map((np, i) => (
                  <div key={np.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        i === 0 ? "bg-purple-600" : i === 1 ? "bg-purple-400" : "bg-purple-200"
                      }`} />
                      <span className="text-sm text-slate-700 truncate">{np.name}</span>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-medium text-slate-900">{formatCurrency(np.amount)}</p>
                      <p className="text-xs text-slate-500">{np.donationCount} donation{np.donationCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
                {nonprofitSummaries.length > 5 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{nonprofitSummaries.length - 5} more organizations
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No nonprofit data yet</p>
            )}
            <Link
              href="/directory"
              className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
            >
              Browse nonprofits <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </StatFlyout>
      </div>

      {/* Tax Receipts - Clickable */}
      <div className="relative" ref={receiptsRef}>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setOpenFlyout(openFlyout === "receipts" ? null : "receipts")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Tax Receipts</p>
                <p className="mt-0.5 text-xl font-semibold text-slate-900">
                  <AnimatedNumber value={receiptsCount} format="number" />
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                <FileText className="h-4 w-4 text-amber-700" />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">Available</p>
          </CardContent>
        </Card>
        <StatFlyout
          isOpen={openFlyout === "receipts"}
          onClose={() => setOpenFlyout(null)}
          title="Tax Receipt Summary"
          containerRef={receiptsRef}
        >
          <div className="space-y-3">
            {receiptSummaries.length > 0 ? (
              <>
                {receiptSummaries.map((receipt) => (
                  <div key={receipt.year} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{receipt.year}</p>
                      <p className="text-xs text-slate-500">{receipt.count} receipt{receipt.count !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(receipt.total)}</p>
                      <p className="text-xs text-slate-500">Total donated</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No receipts available yet</p>
            )}
            <Link
              href="/dashboard/receipts"
              className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
            >
              View all receipts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </StatFlyout>
      </div>
    </div>
  );
}
