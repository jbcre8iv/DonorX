"use client";

import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { FundraiserTeam } from "@/types/database";

interface TeamLeaderboardProps {
  teams: FundraiserTeam[];
  campaignSlug: string;
  limit?: number;
  showViewAll?: boolean;
}

function getRankBg(rank: number) {
  if (rank === 1) return "bg-amber-50 border-amber-200";
  if (rank === 2) return "bg-slate-50 border-slate-200";
  if (rank === 3) return "bg-orange-50 border-orange-200";
  return "bg-white border-slate-100";
}

export function TeamLeaderboard({ teams, campaignSlug, limit = 5, showViewAll = true }: TeamLeaderboardProps) {
  const sortedTeams = [...teams]
    .sort((a, b) => b.raised_cents - a.raised_cents)
    .slice(0, limit);

  if (sortedTeams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Top Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-4">
            No teams yet. Start one!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          Top Teams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedTeams.map((team, index) => {
          const rank = index + 1;

          return (
            <Link
              key={team.id}
              href={`/campaigns/${campaignSlug}/t/${team.slug}`}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(rank)} hover:shadow-sm transition-shadow`}
            >
              <div className="flex-shrink-0 w-6 flex justify-center">
                {rank <= 3 ? (
                  <Trophy className={`h-5 w-5 ${
                    rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : "text-amber-700"
                  }`} />
                ) : (
                  <span className="text-sm font-medium text-slate-400">{rank}</span>
                )}
              </div>

              {team.logo_url ? (
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="h-8 w-8 rounded object-contain bg-white"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-indigo-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {team.name}
                </p>
                <p className="text-xs text-slate-500">
                  {team.member_count} members
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-slate-900">
                  {formatCurrency(team.raised_cents)}
                </p>
              </div>
            </Link>
          );
        })}

        {showViewAll && teams.length > limit && (
          <Link
            href={`/campaigns/${campaignSlug}/teams`}
            className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium pt-2"
          >
            View all {teams.length} teams →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
