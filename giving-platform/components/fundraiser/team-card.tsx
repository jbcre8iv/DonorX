"use client";

import Link from "next/link";
import { Users, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { FundraiserTeam } from "@/types/database";

interface TeamCardProps {
  team: FundraiserTeam;
  campaignSlug: string;
}

export function TeamCard({ team, campaignSlug }: TeamCardProps) {
  const progress = team.goal_cents > 0
    ? Math.round((team.raised_cents / team.goal_cents) * 100)
    : 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Logo/Header */}
      <div className="relative h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
        {team.logo_url ? (
          <img
            src={team.logo_url}
            alt={team.name}
            className="h-16 w-16 rounded-lg object-contain bg-white p-1"
          />
        ) : (
          <Users className="h-12 w-12 text-white/30" />
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1">
          {team.name}
        </h3>

        <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
          <Users className="h-4 w-4" />
          <span>{team.member_count} members</span>
        </div>

        {team.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {team.description}
          </p>
        )}

        {/* Progress */}
        {team.goal_cents > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-slate-700">
                {formatCurrency(team.raised_cents)}
              </span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              of {formatCurrency(team.goal_cents)} goal
            </p>
          </div>
        )}

        {/* Actions */}
        <Button className="w-full" size="sm" variant="outline" asChild>
          <Link href={`/campaigns/${campaignSlug}/t/${team.slug}`}>
            View Team
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
