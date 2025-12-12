"use client";

import * as React from "react";
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Loader2,
  Palette,
  Settings2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { WidgetToken, Nonprofit, NonprofitUser } from "@/types/database";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://donor-x.vercel.app";

export default function NonprofitWidgetPage() {
  const [nonprofit, setNonprofit] = React.useState<Nonprofit | null>(null);
  const [widget, setWidget] = React.useState<WidgetToken | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [copiedSnippet, setCopiedSnippet] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    primary_color: "#059669",
    button_text: "Donate Now",
    preset_amounts: "25,50,100,250",
    min_amount: 5,
    allow_custom_amount: true,
    show_cover_fees: true,
    show_anonymous: true,
  });

  React.useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Get current user's nonprofit
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: nonprofitUser } = await supabase
        .from("nonprofit_users")
        .select(`nonprofit:nonprofits(*)`)
        .eq("user_id", user.id)
        .single();

      if (nonprofitUser?.nonprofit) {
        const np = (Array.isArray(nonprofitUser.nonprofit)
          ? nonprofitUser.nonprofit[0]
          : nonprofitUser.nonprofit) as Nonprofit;
        setNonprofit(np);

        // Check for existing widget
        const { data: existingWidget } = await supabase
          .from("widget_tokens")
          .select("*")
          .eq("nonprofit_id", np.id)
          .eq("is_active", true)
          .single();

        if (existingWidget) {
          setWidget(existingWidget as WidgetToken);
        } else {
          // Pre-fill form with nonprofit name
          setFormData(prev => ({
            ...prev,
            name: `${np.name} Website Widget`,
          }));
        }
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const handleCreateWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nonprofit) return;

    setCreating(true);
    setError(null);

    try {
      const supabase = createClient();

      // Parse preset amounts
      const presetAmounts = formData.preset_amounts
        .split(",")
        .map((s) => parseInt(s.trim()) * 100)
        .filter((n) => !isNaN(n) && n > 0);

      const { data: newWidget, error: createError } = await supabase
        .from("widget_tokens")
        .insert({
          nonprofit_id: nonprofit.id,
          name: formData.name,
          primary_color: formData.primary_color,
          button_text: formData.button_text,
          preset_amounts: presetAmounts,
          min_amount_cents: formData.min_amount * 100,
          allow_custom_amount: formData.allow_custom_amount,
          show_cover_fees: formData.show_cover_fees,
          show_anonymous: formData.show_anonymous,
          show_dedications: false,
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      setWidget(newWidget as WidgetToken);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create widget");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string, snippetName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSnippet(snippetName);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!nonprofit) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Unable to load nonprofit information</p>
      </div>
    );
  }

  // Generate embed snippets
  const inlineSnippet = widget ? `<!-- DonorX Donation Widget -->
<script src="${BASE_URL}/widget/embed.js"></script>
<div id="donorx-widget"></div>
<script>
  DonorXWidget.init({
    token: '${widget.token}',
    container: 'donorx-widget'
  });
</script>` : "";

  const buttonSnippet = widget ? `<!-- DonorX Donate Button -->
<script src="${BASE_URL}/widget/embed.js"></script>
<div id="donorx-button"></div>
<script>
  DonorXWidget.button({
    token: '${widget.token}',
    container: 'donorx-button',
    buttonText: '${widget.button_text || "Donate"}',
    buttonColor: '${widget.primary_color || "#059669"}'
  });
</script>` : "";

  const directLinkUrl = widget ? `${BASE_URL}/widget/${widget.token}` : "";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Donation Widget</h1>
        <p className="text-slate-600">
          Add a donation form to your website so visitors can give without leaving your site
        </p>
      </div>

      {!widget && !showCreateForm ? (
        /* No widget yet - show intro */
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Code className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Embed Donations on Your Website
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              Create a customizable donation widget that you can embed on your website.
              Donors can give directly without leaving your site.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Widget
            </Button>
          </CardContent>
        </Card>
      ) : showCreateForm ? (
        /* Create widget form */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Configure Your Widget
            </CardTitle>
            <CardDescription>
              Customize how the donation form appears on your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWidget} className="space-y-6">
              {/* Name */}
              <Input
                label="Widget Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Homepage Widget"
                required
                helperText="Internal name to identify this widget"
              />

              {/* Customization */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="h-10 w-14 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-sm"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>

                <Input
                  label="Button Text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="Donate Now"
                />
              </div>

              {/* Preset Amounts */}
              <Input
                label="Suggested Amounts (in dollars)"
                value={formData.preset_amounts}
                onChange={(e) => setFormData({ ...formData, preset_amounts: e.target.value })}
                placeholder="25, 50, 100, 250"
                helperText="Comma-separated dollar amounts donors can click to select"
              />

              {/* Min Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900">
                  Minimum Donation
                </label>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({ ...formData, min_amount: parseFloat(e.target.value) || 5 })}
                    min="1"
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-900">
                  Widget Options
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_custom_amount}
                    onChange={(e) => setFormData({ ...formData, allow_custom_amount: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-sm text-slate-700">Allow custom amount entry</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_cover_fees}
                    onChange={(e) => setFormData({ ...formData, show_cover_fees: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-sm text-slate-700">Show &quot;cover fees&quot; option</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_anonymous}
                    onChange={(e) => setFormData({ ...formData, show_anonymous: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-sm text-slate-700">Show anonymous donation option</span>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Code className="mr-2 h-4 w-4" />
                      Create Widget
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : widget ? (
        /* Widget exists - show embed codes */
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: widget.primary_color || "#059669" }}
                  >
                    <Code className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{widget.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="success">Active</Badge>
                      <span className="text-sm text-slate-500">
                        {widget.total_donations || 0} donations
                      </span>
                      <span className="text-sm text-slate-500">
                        {formatCurrency(widget.total_raised_cents || 0)} raised
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={directLinkUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Preview
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Embed Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>
                Copy one of these snippets to add the donation widget to your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Inline Widget */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">Inline Widget</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(inlineSnippet, "inline")}
                  >
                    {copiedSnippet === "inline" ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  Embeds the donation form directly on your page
                </p>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{inlineSnippet}</code>
                </pre>
              </div>

              {/* Button Widget */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">Donate Button</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(buttonSnippet, "button")}
                  >
                    {copiedSnippet === "button" ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  Shows a button that opens the donation form in a popup
                </p>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{buttonSnippet}</code>
                </pre>
              </div>

              {/* Direct Link */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">Direct Link</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(directLinkUrl, "link")}
                  >
                    {copiedSnippet === "link" ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  Use this link in emails, social media, or anywhere you want to link directly
                </p>
                <div className="bg-slate-100 p-4 rounded-lg text-sm">
                  <code className="text-slate-700 break-all">{directLinkUrl}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Primary Color</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded border border-slate-200"
                      style={{ backgroundColor: widget.primary_color || "#059669" }}
                    />
                    <span className="text-slate-900">{widget.primary_color || "#059669"}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Button Text</dt>
                  <dd className="mt-1 text-slate-900">{widget.button_text || "Donate Now"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Minimum Donation</dt>
                  <dd className="mt-1 text-slate-900">
                    {formatCurrency(widget.min_amount_cents || 500)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Suggested Amounts</dt>
                  <dd className="mt-1 text-slate-900">
                    {(widget.preset_amounts || [2500, 5000, 10000, 25000])
                      .map((a: number) => formatCurrency(a))
                      .join(", ")}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
