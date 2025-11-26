import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Layers, Trash2, Edit, Heart, Building2, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Allocation Templates",
};

export default async function TemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  // Fetch templates with items
  let templates: Array<{
    id: string;
    name: string;
    is_default: boolean;
    created_at: string;
    items: Array<{
      id: string;
      percentage: number;
      nonprofit?: { id: string; name: string } | null;
      category?: { id: string; name: string } | null;
    }>;
  }> = [];

  if (userData?.organization_id) {
    const { data: templateData } = await supabase
      .from("allocation_templates")
      .select(`
        id,
        name,
        is_default,
        created_at,
        items:allocation_template_items(
          id,
          percentage,
          nonprofit:nonprofits(id, name),
          category:categories(id, name)
        )
      `)
      .eq("organization_id", userData.organization_id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    // Map the data - Supabase returns arrays for single relations
    templates = (templateData || []).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      name: t.name as string,
      is_default: t.is_default as boolean,
      created_at: t.created_at as string,
      items: ((t.items as Array<Record<string, unknown>>) || []).map((item) => ({
        id: item.id as string,
        percentage: item.percentage as number,
        nonprofit: Array.isArray(item.nonprofit) ? item.nonprofit[0] : item.nonprofit,
        category: Array.isArray(item.category) ? item.category[0] : item.category,
      })),
    }));
  }

  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Allocation Templates
          </h1>
          <p className="text-slate-600">
            Save and reuse your favorite allocation configurations
          </p>
        </div>
        <Button asChild>
          <Link href="/donate">
            <Plus className="mr-2 h-4 w-4" />
            Create from Donation
          </Link>
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Layers className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.is_default && (
                      <Badge variant="default" className="mt-1">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {/* Allocation Breakdown */}
              <div className="space-y-2">
                {template.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {item.nonprofit ? (
                        <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      ) : (
                        <Tag className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-slate-600 truncate">
                        {item.nonprofit?.name || item.category?.name || "Unknown"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 flex-shrink-0">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
                {template.items?.map((item, index) => (
                  <div
                    key={item.id}
                    className={colors[index % colors.length]}
                    style={{ width: `${item.percentage}%` }}
                  />
                ))}
              </div>

              <p className="text-xs text-slate-400 mt-2">
                Created {formatDate(template.created_at)}
              </p>

              {/* Actions */}
              <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100">
                <Button variant="default" size="sm" className="flex-1" asChild>
                  <Link href={`/donate?template=${template.id}`}>
                    <Heart className="mr-2 h-4 w-4" />
                    Use Template
                  </Link>
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  disabled
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State / Create New Card */}
        <Link href="/donate">
          <Card className="flex items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer transition-colors h-full min-h-[300px]">
            <CardContent className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
                <Plus className="h-6 w-6 text-slate-400" />
              </div>
              <p className="font-medium text-slate-900">Create New Template</p>
              <p className="mt-1 text-sm text-slate-500">
                {templates.length === 0
                  ? "Start by making a donation, then save it as a template"
                  : "Save your allocation preferences"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-1">
              How templates work
            </h3>
            <p className="text-sm text-blue-700">
              Templates let you save your favorite allocation configurations so you can quickly
              reuse them for future donations. After making a donation, you can save the
              allocation as a template from your donation confirmation page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
