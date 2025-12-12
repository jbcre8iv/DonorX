"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Code,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { deleteWidget, toggleWidgetActive } from "../actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { WidgetToken, Nonprofit } from "@/types/database";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://donor-x.vercel.app";

export default function WidgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const widgetId = params.id as string;

  const [widget, setWidget] = React.useState<(WidgetToken & { nonprofit: Nonprofit }) | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copiedSnippet, setCopiedSnippet] = React.useState<string | null>(null);
  const [isToggling, setIsToggling] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    async function fetchWidget() {
      const supabase = createClient();
      const { data } = await supabase
        .from("widget_tokens")
        .select(`
          *,
          nonprofit:nonprofits(id, name, logo_url)
        `)
        .eq("id", widgetId)
        .single();

      if (data) {
        setWidget(data as WidgetToken & { nonprofit: Nonprofit });
      }
      setLoading(false);
    }

    fetchWidget();
  }, [widgetId]);

  const copyToClipboard = async (text: string, snippetName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSnippet(snippetName);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleToggleActive = async () => {
    if (!widget) return;
    setIsToggling(true);
    const result = await toggleWidgetActive(widget.id, !widget.is_active);
    if (result.success) {
      setWidget({ ...widget, is_active: !widget.is_active });
    }
    setIsToggling(false);
  };

  const handleDelete = async () => {
    if (!widget) return;
    if (!confirm("Are you sure you want to delete this widget? This cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    const result = await deleteWidget(widget.id);
    if (result.success) {
      router.push("/admin/widgets");
    } else {
      alert(result.error || "Failed to delete widget");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/widgets"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Widgets
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">Widget not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate embed snippets
  const inlineSnippet = `<!-- DonorX Donation Widget -->
<script src="${BASE_URL}/widget/embed.js"></script>
<div id="donorx-widget"></div>
<script>
  DonorXWidget.init({
    token: '${widget.token}',
    container: 'donorx-widget'
  });
</script>`;

  const buttonSnippet = `<!-- DonorX Donate Button -->
<script src="${BASE_URL}/widget/embed.js"></script>
<div id="donorx-button"></div>
<script>
  DonorXWidget.button({
    token: '${widget.token}',
    container: 'donorx-button',
    buttonText: '${widget.button_text || "Donate"}',
    buttonColor: '${widget.primary_color || "#059669"}'
  });
</script>`;

  const dataAttrSnippet = `<!-- DonorX Widget (Auto-Initialize) -->
<script src="${BASE_URL}/widget/embed.js"></script>
<div
  id="my-widget"
  data-donorx-token="${widget.token}"
  data-donorx-mode="inline"
></div>`;

  const directLinkUrl = `${BASE_URL}/widget/${widget.token}`;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/widgets"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Widgets
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {widget.nonprofit?.logo_url ? (
            <img
              src={widget.nonprofit.logo_url}
              alt={widget.nonprofit.name}
              className="h-12 w-12 rounded-lg object-contain"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
              {widget.nonprofit?.name?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{widget.name}</h1>
            <p className="text-slate-600">{widget.nonprofit?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={widget.is_active ? "success" : "secondary"} className="text-sm">
            {widget.is_active ? (
              <>
                <ToggleRight className="h-3.5 w-3.5 mr-1" />
                Active
              </>
            ) : (
              <>
                <ToggleLeft className="h-3.5 w-3.5 mr-1" />
                Inactive
              </>
            )}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={isToggling}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : widget.is_active ? (
              "Deactivate"
            ) : (
              "Activate"
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={directLinkUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Preview
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Donations</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {widget.total_donations || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Raised</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(widget.total_raised_cents || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Created</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatDate(widget.created_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Embed Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Embed Code
          </CardTitle>
          <CardDescription>
            Copy one of these snippets to embed the donation widget on any website
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
              Embeds the donation form directly on the page
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
              Shows a button that opens the donation form in a modal
            </p>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{buttonSnippet}</code>
            </pre>
          </div>

          {/* Data Attributes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-900">Auto-Initialize (Data Attributes)</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(dataAttrSnippet, "data")}
              >
                {copiedSnippet === "data" ? (
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
              Automatically initializes using data attributes (no JavaScript required)
            </p>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{dataAttrSnippet}</code>
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
              Link directly to the donation form (for emails, social media, etc.)
            </p>
            <div className="bg-slate-100 p-4 rounded-lg text-sm">
              <code className="text-slate-700 break-all">{directLinkUrl}</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Settings */}
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
              <dt className="text-sm font-medium text-slate-500">Preset Amounts</dt>
              <dd className="mt-1 text-slate-900">
                {(widget.preset_amounts || [2500, 5000, 10000, 25000])
                  .map((a: number) => formatCurrency(a))
                  .join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Options</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {widget.allow_custom_amount && (
                  <Badge variant="secondary">Custom Amount</Badge>
                )}
                {widget.show_cover_fees && (
                  <Badge variant="secondary">Cover Fees</Badge>
                )}
                {widget.show_anonymous && (
                  <Badge variant="secondary">Anonymous Option</Badge>
                )}
                {widget.show_dedications && (
                  <Badge variant="secondary">Dedications</Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Delete Widget</p>
              <p className="text-sm text-slate-500">
                Permanently delete this widget. Any embedded instances will stop working.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Widget
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
