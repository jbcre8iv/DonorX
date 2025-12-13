"use client";

import * as React from "react";
import { Heart, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CampaignDonation, Donation } from "@/types/database";

interface DonorRollProps {
  donations: (CampaignDonation & { donation?: Donation })[];
  showAmounts?: boolean;
  initialCount?: number;
}

export function DonorRoll({
  donations,
  showAmounts = true,
  initialCount = 5,
}: DonorRollProps) {
  const [showAll, setShowAll] = React.useState(false);

  const visibleDonations = showAll ? donations : donations.slice(0, initialCount);
  const hasMore = donations.length > initialCount;

  if (donations.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Heart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">Be the first to donate!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleDonations.map((cd) => (
        <DonorItem
          key={cd.id}
          donation={cd}
          showAmount={showAmounts}
        />
      ))}

      {hasMore && !showAll && (
        <Button
          variant="ghost"
          className="w-full text-slate-600"
          onClick={() => setShowAll(true)}
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          Show all {donations.length} donors
        </Button>
      )}
    </div>
  );
}

function DonorItem({
  donation,
  showAmount,
}: {
  donation: CampaignDonation & { donation?: Donation };
  showAmount: boolean;
}) {
  const displayName = donation.is_anonymous
    ? "Anonymous"
    : donation.donor_display_name || "A generous donor";

  const timeAgo = getTimeAgo(donation.created_at);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
        {donation.is_anonymous ? (
          <User className="h-5 w-5 text-emerald-600" />
        ) : (
          <span className="text-sm font-semibold text-emerald-700">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-slate-900 truncate">
            {displayName}
          </span>
          {showAmount && donation.donation?.amount_cents && (
            <span className="font-semibold text-emerald-600 flex-shrink-0">
              {formatCurrency(donation.donation.amount_cents)}
            </span>
          )}
        </div>

        {/* Comment */}
        {donation.donor_comment && (
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
            &ldquo;{donation.donor_comment}&rdquo;
          </p>
        )}

        {/* Time */}
        <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Compact version for sidebar
export function DonorRollCompact({
  donations,
  limit = 3,
}: {
  donations: (CampaignDonation & { donation?: Donation })[];
  limit?: number;
}) {
  const recent = donations.slice(0, limit);

  if (recent.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        Recent Donors
      </h4>
      {recent.map((cd) => {
        const displayName = cd.is_anonymous
          ? "Anonymous"
          : cd.donor_display_name || "Someone";
        return (
          <div key={cd.id} className="flex items-center gap-2 text-sm">
            <Heart className="h-3 w-3 text-rose-400 flex-shrink-0" />
            <span className="text-slate-600 truncate">{displayName}</span>
            {cd.donation?.amount_cents && (
              <span className="text-slate-400 flex-shrink-0">
                {formatCurrency(cd.donation.amount_cents)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
