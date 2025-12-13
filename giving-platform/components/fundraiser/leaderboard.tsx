"use client";

import Link from "next/link";
import { Trophy, Medal, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Fundraiser } from "@/types/database";

interface LeaderboardProps {
  fundraisers: (Fundraiser & { user?: { full_name: string | null; email: string } })[];
  campaignSlug: string;
  limit?: number;
  showViewAll?: boolean;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="w-5 text-center text-sm font-medium text-slate-400">{rank}</span>;
}

function getRankBg(rank: number) {
  if (rank === 1) return "bg-amber-50 border-amber-200";
  if (rank === 2) return "bg-slate-50 border-slate-200";
  if (rank === 3) return "bg-orange-50 border-orange-200";
  return "bg-white border-slate-100";
}

export function Leaderboard({ fundraisers, campaignSlug, limit = 10, showViewAll = true }: LeaderboardProps) {
  const sortedFundraisers = [...fundraisers]
    .filter(f => f.show_on_leaderboard)
    .sort((a, b) => b.raised_cents - a.raised_cents)
    .slice(0, limit);

  if (sortedFundraisers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Top Fundraisers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-4">
            No fundraisers yet. Be the first!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top Fundraisers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedFundraisers.map((fundraiser, index) => {
          const rank = index + 1;
          const displayName = fundraiser.user?.full_name || fundraiser.user?.email?.split("@")[0] || "Fundraiser";

          return (
            <Link
              key={fundraiser.id}
              href={`/campaigns/${campaignSlug}/f/${fundraiser.slug}`}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(rank)} hover:shadow-sm transition-shadow`}
            >
              <div className="flex-shrink-0 w-6 flex justify-center">
                {getRankIcon(rank)}
              </div>

              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-slate-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {fundraiser.title}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-slate-900">
                  {formatCurrency(fundraiser.raised_cents)}
                </p>
                <p className="text-xs text-slate-500">
                  {fundraiser.donation_count} donations
                </p>
              </div>
            </Link>
          );
        })}

        {showViewAll && fundraisers.length > limit && (
          <Link
            href={`/campaigns/${campaignSlug}/fundraisers`}
            className="block text-center text-sm text-purple-600 hover:text-purple-700 font-medium pt-2"
          >
            View all {fundraisers.length} fundraisers →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for sidebars
export function LeaderboardCompact({ fundraisers, campaignSlug, limit = 5 }: LeaderboardProps) {
  const sortedFundraisers = [...fundraisers]
    .filter(f => f.show_on_leaderboard)
    .sort((a, b) => b.raised_cents - a.raised_cents)
    .slice(0, limit);

  if (sortedFundraisers.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-500 flex items-center gap-1">
        <Trophy className="h-4 w-4 text-amber-500" />
        Top Fundraisers
      </h3>
      {sortedFundraisers.map((fundraiser, index) => {
        const displayName = fundraiser.user?.full_name || fundraiser.user?.email?.split("@")[0] || "Fundraiser";

        return (
          <Link
            key={fundraiser.id}
            href={`/campaigns/${campaignSlug}/f/${fundraiser.slug}`}
            className="flex items-center gap-2 text-sm hover:bg-slate-50 rounded p-1 -mx-1"
          >
            <span className="w-4 text-xs text-slate-400 text-center">{index + 1}</span>
            <span className="flex-1 truncate text-slate-700">{displayName}</span>
            <span className="text-slate-900 font-medium">
              {formatCurrency(fundraiser.raised_cents)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
