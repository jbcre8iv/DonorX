"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCampaign, updateCampaign, deleteCampaign } from "./actions";
import type { Campaign, Nonprofit, CampaignStatus } from "@/types/database";

interface CampaignFormProps {
  campaign?: Campaign;
  nonprofits: Pick<Nonprofit, "id" | "name">[];
}

export function CampaignForm({ campaign, nonprofits }: CampaignFormProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [nonprofitId, setNonprofitId] = React.useState(campaign?.nonprofit_id || "");
  const [title, setTitle] = React.useState(campaign?.title || "");
  const [slug, setSlug] = React.useState(campaign?.slug || "");
  const [shortDescription, setShortDescription] = React.useState(
    campaign?.short_description || ""
  );
  const [description, setDescription] = React.useState(campaign?.description || "");
  const [coverImageUrl, setCoverImageUrl] = React.useState(
    campaign?.cover_image_url || ""
  );
  const [goalDollars, setGoalDollars] = React.useState(
    campaign ? (campaign.goal_cents / 100).toString() : ""
  );
  const [startDate, setStartDate] = React.useState(
    campaign?.start_date
      ? new Date(campaign.start_date).toISOString().split("T")[0]
      : ""
  );
  const [endDate, setEndDate] = React.useState(
    campaign?.end_date
      ? new Date(campaign.end_date).toISOString().split("T")[0]
      : ""
  );
  const [status, setStatus] = React.useState<CampaignStatus>(
    campaign?.status || "draft"
  );
  const [featured, setFeatured] = React.useState(campaign?.featured || false);
  const [allowPeerFundraising, setAllowPeerFundraising] = React.useState(
    campaign?.allow_peer_fundraising || false
  );
  const [showDonorAmounts, setShowDonorAmounts] = React.useState(
    campaign?.show_donor_amounts ?? true
  );

  // Auto-generate slug from title
  React.useEffect(() => {
    if (!campaign && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  }, [title, campaign]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = {
      nonprofitId,
      title,
      slug,
      shortDescription,
      description,
      coverImageUrl,
      goalCents: Math.round(parseFloat(goalDollars) * 100),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      status,
      featured,
      allowPeerFundraising,
      showDonorAmounts,
    };

    try {
      const result = campaign
        ? await updateCampaign(campaign.id, formData)
        : await createCampaign(formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/campaigns");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!campaign) return;
    if (!confirm("Are you sure you want to delete this campaign? This cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteCampaign(campaign.id);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/campaigns");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nonprofit">Nonprofit *</Label>
              <Select value={nonprofitId} onValueChange={setNonprofitId} required>
                <SelectTrigger id="nonprofit">
                  <SelectValue placeholder="Select nonprofit" />
                </SelectTrigger>
                <SelectContent>
                  {nonprofits.map((np) => (
                    <SelectItem key={np.id} value={np.id}>
                      {np.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as CampaignStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer Fundraising Campaign"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">/campaigns/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="summer-fundraiser"
                required
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A brief summary for cards and previews"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed campaign description..."
              rows={5}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">Cover Image URL</Label>
            <Input
              id="coverImageUrl"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
          </div>
        </CardContent>
      </Card>

      {/* Goal & Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Goal & Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Fundraising Goal ($) *</Label>
            <Input
              id="goal"
              value={goalDollars}
              onChange={(e) => setGoalDollars(e.target.value)}
              placeholder="10000"
              type="number"
              min="1"
              step="1"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                type="date"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                type="date"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-medium text-slate-900">Featured Campaign</span>
              <p className="text-sm text-slate-500">
                Display prominently on the campaigns page
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showDonorAmounts}
              onChange={(e) => setShowDonorAmounts(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-medium text-slate-900">Show Donation Amounts</span>
              <p className="text-sm text-slate-500">
                Display individual donation amounts on the donor roll
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowPeerFundraising}
              onChange={(e) => setAllowPeerFundraising(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-medium text-slate-900">
                Allow Peer-to-Peer Fundraising
              </span>
              <p className="text-sm text-slate-500">
                Let supporters create their own fundraising pages for this campaign
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Stats (edit mode only) */}
      {campaign && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Amount Raised</p>
                <p className="text-2xl font-semibold text-emerald-600">
                  ${(campaign.raised_cents / 100).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Donations</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {campaign.donation_count}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Progress</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {Math.round((campaign.raised_cents / campaign.goal_cents) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {campaign && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Campaign
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/campaigns")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || deleting}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {campaign ? "Save Changes" : "Create Campaign"}
          </Button>
        </div>
      </div>
    </form>
  );
}
