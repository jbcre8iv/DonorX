"use client";

import Link from "next/link";
import { Target, Building2, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CampaignProgress } from "./campaign-progress";
import { CampaignCountdown } from "./campaign-countdown";
import { SocialShare } from "./social-share";
import type { Campaign, Nonprofit } from "@/types/database";

interface CampaignHeroProps {
  campaign: Campaign & { nonprofit?: Nonprofit };
  donateUrl: string;
}

export function CampaignHero({ campaign, donateUrl }: CampaignHeroProps) {
  const isEnded = campaign.status === "ended" || new Date(campaign.end_date) < new Date();
  const isActive = campaign.status === "active" && !isEnded;
  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://donor-x.vercel.app/campaigns/${campaign.slug}`;

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 lg:h-96 bg-slate-100">
        {campaign.cover_image_url ? (
          <img
            src={campaign.cover_image_url}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700">
            <Target className="h-24 w-24 text-white/30" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Status badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {campaign.featured && (
            <Badge className="bg-amber-500 text-white">Featured Campaign</Badge>
          )}
          {isEnded && (
            <Badge variant="secondary" className="bg-white/90">Campaign Ended</Badge>
          )}
          {isActive && (
            <Badge className="bg-emerald-500 text-white">Active</Badge>
          )}
        </div>
      </div>

      {/* Content overlay */}
      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* Nonprofit info */}
          {campaign.nonprofit && (
            <div className="flex items-center gap-3 mb-4">
              {campaign.nonprofit.logo_url ? (
                <img
                  src={campaign.nonprofit.logo_url}
                  alt={campaign.nonprofit.name}
                  className="h-10 w-10 rounded-lg object-contain"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
              )}
              <div>
                <Link
                  href={`/directory/${campaign.nonprofit.id}`}
                  className="text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors"
                >
                  {campaign.nonprofit.name}
                </Link>
                <p className="text-xs text-slate-500">Verified Nonprofit</p>
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            {campaign.title}
          </h1>

          {/* Countdown & dates */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {isActive && (
              <CampaignCountdown endDate={campaign.end_date} />
            )}
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(campaign.start_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                {" - "}
                {new Date(campaign.end_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <CampaignProgress
              raisedCents={campaign.raised_cents}
              goalCents={campaign.goal_cents}
              donationCount={campaign.donation_count}
              size="lg"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {isActive ? (
              <Button size="lg" className="flex-1 sm:flex-none" asChild>
                <Link href={donateUrl}>
                  Donate Now
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="secondary" disabled className="flex-1 sm:flex-none">
                Campaign Ended
              </Button>
            )}

            <div className="flex items-center justify-center sm:justify-start">
              <SocialShare
                url={shareUrl}
                title={campaign.title}
                description={campaign.short_description || undefined}
              />
            </div>

            {campaign.nonprofit?.website && (
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <a
                  href={campaign.nonprofit.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
