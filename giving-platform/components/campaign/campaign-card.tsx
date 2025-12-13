"use client";

import Link from "next/link";
import { Target, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignProgress } from "./campaign-progress";
import { CampaignCountdownCompact } from "./campaign-countdown";
import { formatCurrency } from "@/lib/utils";
import type { Campaign, Nonprofit } from "@/types/database";

interface CampaignCardProps {
  campaign: Campaign & { nonprofit?: Nonprofit };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const isEnded = campaign.status === "ended" || new Date(campaign.end_date) < new Date();
  const percentFunded = campaign.goal_cents > 0
    ? Math.round((campaign.raised_cents / campaign.goal_cents) * 100)
    : 0;

  return (
    <Link href={`/campaigns/${campaign.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        {/* Cover Image */}
        <div className="relative h-48 bg-slate-100">
          {campaign.cover_image_url ? (
            <img
              src={campaign.cover_image_url}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700">
              <Target className="h-16 w-16 text-white/50" />
            </div>
          )}

          {/* Status badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {campaign.featured && (
              <Badge className="bg-amber-500 text-white">Featured</Badge>
            )}
            {isEnded && (
              <Badge variant="secondary">Ended</Badge>
            )}
          </div>

          {/* Countdown */}
          {!isEnded && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
              <CampaignCountdownCompact endDate={campaign.end_date} />
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Nonprofit */}
          {campaign.nonprofit && (
            <div className="flex items-center gap-2">
              {campaign.nonprofit.logo_url ? (
                <img
                  src={campaign.nonprofit.logo_url}
                  alt={campaign.nonprofit.name}
                  className="h-5 w-5 rounded object-contain"
                />
              ) : (
                <div className="h-5 w-5 rounded bg-slate-200" />
              )}
              <span className="text-xs text-slate-500 truncate">
                {campaign.nonprofit.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-slate-900 line-clamp-2 leading-tight">
            {campaign.title}
          </h3>

          {/* Short description */}
          {campaign.short_description && (
            <p className="text-sm text-slate-600 line-clamp-2">
              {campaign.short_description}
            </p>
          )}

          {/* Progress */}
          <CampaignProgress
            raisedCents={campaign.raised_cents}
            goalCents={campaign.goal_cents}
            donationCount={campaign.donation_count}
            showLabels={false}
            size="sm"
          />

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-semibold text-slate-900">
                {formatCurrency(campaign.raised_cents)}
              </span>
              <span className="text-slate-500"> raised</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <Users className="h-3.5 w-3.5" />
              <span>{campaign.donation_count}</span>
            </div>
          </div>

          {/* Percentage badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Goal: {formatCurrency(campaign.goal_cents)}
            </span>
            <Badge
              variant={percentFunded >= 100 ? "success" : "secondary"}
              className="text-xs"
            >
              {percentFunded}% funded
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
