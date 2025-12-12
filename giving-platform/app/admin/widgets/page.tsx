import Link from "next/link";
import { Code, Plus, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { WidgetToken, Nonprofit } from "@/types/database";

export const metadata = {
  title: "Widget Management - Admin",
};

export default async function AdminWidgetsPage() {
  const supabase = await createClient();

  // Fetch all widgets with nonprofit info
  const { data: widgets } = await supabase
    .from("widget_tokens")
    .select(`
      *,
      nonprofit:nonprofits(id, name, logo_url)
    `)
    .order("created_at", { ascending: false });

  const typedWidgets = (widgets || []) as (WidgetToken & { nonprofit: Nonprofit })[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Donation Widgets</h1>
          <p className="text-slate-600">
            Create embeddable donation forms for nonprofit websites
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/widgets/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Widget
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Widgets</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {typedWidgets.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Active Widgets</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {typedWidgets.filter((w) => w.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Widget Donations</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(
                typedWidgets.reduce((sum, w) => sum + (w.total_raised_cents || 0), 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Widgets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Widgets ({typedWidgets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {typedWidgets.length === 0 ? (
            <div className="text-center py-12">
              <Code className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No widgets created yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Create your first embeddable donation widget
              </p>
              <Button className="mt-4" asChild>
                <Link href="/admin/widgets/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Widget
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {typedWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-200 p-4 gap-4"
                >
                  <div className="flex items-center gap-4">
                    {widget.nonprofit?.logo_url ? (
                      <img
                        src={widget.nonprofit.logo_url}
                        alt={widget.nonprofit.name}
                        className="h-10 w-10 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {widget.nonprofit?.name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-slate-900">{widget.name}</h3>
                      <p className="text-sm text-slate-500">
                        {widget.nonprofit?.name || "Unknown nonprofit"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="text-slate-500">
                      <span className="font-medium text-slate-700">
                        {widget.total_donations || 0}
                      </span>{" "}
                      donations
                    </div>
                    <div className="text-slate-500">
                      <span className="font-medium text-slate-700">
                        {formatCurrency(widget.total_raised_cents || 0)}
                      </span>{" "}
                      raised
                    </div>
                    <Badge variant={widget.is_active ? "success" : "secondary"}>
                      {widget.is_active ? (
                        <>
                          <ToggleRight className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/widgets/${widget.id}`}>
                        <Code className="h-4 w-4 mr-1" />
                        Get Code
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/widget/${widget.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
