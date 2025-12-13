"use client";

import Link from "next/link";
import { User, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Fundraiser, Campaign } from "@/types/database";

interface FundraiserCardProps {
  fundraiser: Fundraiser & { campaign?: Campaign; user?: { full_name: string | null; email: string } };
  campaignSlug: string;
}

export function FundraiserCard({ fundraiser, campaignSlug }: FundraiserCardProps) {
  const progress = fundraiser.personal_goal_cents > 0
    ? Math.round((fundraiser.raised_cents / fundraiser.personal_goal_cents) * 100)
    : 0;

  const displayName = fundraiser.user?.full_name || fundraiser.user?.email?.split("@")[0] || "Fundraiser";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-br from-purple-500 to-purple-700">
        {fundraiser.cover_image_url ? (
          <img
            src={fundraiser.cover_image_url}
            alt={fundraiser.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Target className="h-12 w-12 text-white/30" />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Fundraiser info */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <span className="text-sm text-slate-600">{displayName}</span>
        </div>

        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
          {fundraiser.title}
        </h3>

        {fundraiser.story && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {fundraiser.story}
          </p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">
              {formatCurrency(fundraiser.raised_cents)}
            </span>
            <span className="text-slate-500">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            of {formatCurrency(fundraiser.personal_goal_cents)} goal
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span>{fundraiser.donation_count} donations</span>
        </div>

        {/* Actions */}
        <Button className="w-full" size="sm" asChild>
          <Link href={`/campaigns/${campaignSlug}/f/${fundraiser.slug}`}>
            View & Donate
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
