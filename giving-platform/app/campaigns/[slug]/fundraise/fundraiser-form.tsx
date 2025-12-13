"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFundraiser } from "./actions";
import type { Campaign, FundraiserTeam } from "@/types/database";

interface FundraiserFormProps {
  campaign: Campaign;
  teams: FundraiserTeam[];
  userId: string;
  preselectedTeamId?: string;
}

export function FundraiserForm({ campaign, teams, userId, preselectedTeamId }: FundraiserFormProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [story, setStory] = React.useState("");
  const [goalDollars, setGoalDollars] = React.useState("500");
  const [teamId, setTeamId] = React.useState<string>(preselectedTeamId || "");
  const [coverImageUrl, setCoverImageUrl] = React.useState("");

  // Auto-generate slug from title
  React.useEffect(() => {
    if (title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  }, [title]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const result = await createFundraiser({
        campaignId: campaign.id,
        userId,
        title,
        slug,
        story,
        personalGoalCents: Math.round(parseFloat(goalDollars) * 100),
        teamId: teamId || null,
        coverImageUrl: coverImageUrl || null,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.fundraiser) {
        router.push(`/campaigns/${campaign.slug}/f/${result.fundraiser.slug}`);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-slate-900">
          Fundraiser Title *
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Help me reach my goal!"
          required
        />
        <p className="text-xs text-slate-500">
          This appears as the headline on your fundraising page
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium text-slate-900">
          Page URL *
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 whitespace-nowrap">
            /campaigns/{campaign.slug}/f/
          </span>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-fundraiser"
            required
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="goal" className="text-sm font-medium text-slate-900">
          Personal Goal ($) *
        </label>
        <Input
          id="goal"
          type="number"
          value={goalDollars}
          onChange={(e) => setGoalDollars(e.target.value)}
          placeholder="500"
          min="1"
          step="1"
          required
        />
        <p className="text-xs text-slate-500">
          How much do you want to raise?
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="story" className="text-sm font-medium text-slate-900">
          Your Story
        </label>
        <textarea
          id="story"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Share why this cause is important to you..."
          rows={4}
          className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 placeholder:text-slate-400"
        />
      </div>

      {teams.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="team" className="text-sm font-medium text-slate-900">
            Join a Team (Optional)
          </label>
          <div className="relative">
            <select
              id="team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="flex h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="">Fundraise individually</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.member_count} members)
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="coverImage" className="text-sm font-medium text-slate-900">
          Cover Image URL (Optional)
        </label>
        <Input
          id="coverImage"
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create My Fundraiser"
          )}
        </Button>
      </div>
    </form>
  );
}
