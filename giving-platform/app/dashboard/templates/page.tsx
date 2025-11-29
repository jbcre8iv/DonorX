import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Layers, Trash2, Edit, Heart, Building2, Tag, User, RefreshCw, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { DeleteTemplateButton } from "./delete-template-button";

export const metadata = {
  title: "Donation Templates",
};

export default async function TemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch personal donation templates
  const { data: donationTemplates } = await supabase
    .from("donation_templates")
    .select(`
      id,
      name,
      description,
      amount_cents,
      frequency,
      created_at,
      updated_at,
      donation_template_items (
        id,
        type,
        target_id,
        target_name,
        percentage
      )
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const personalTemplates = (donationTemplates || []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    name: t.name as string,
    description: t.description as string | null,
    amountCents: t.amount_cents as number | null,
    frequency: t.frequency as string | null,
    createdAt: t.created_at as string,
    updatedAt: t.updated_at as string,
    items: ((t.donation_template_items as Array<Record<string, unknown>>) || []).map((item) => ({
      id: item.id as string,
      type: item.type as "nonprofit" | "category",
      targetId: item.target_id as string,
      targetName: item.target_name as string,
      percentage: item.percentage as number,
    })),
  }));

  // Get user's organization for org templates
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  // Fetch organization templates with items (if user belongs to org)
  let orgTemplates: Array<{
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
    orgTemplates = (templateData || []).map((t: Record<string, unknown>) => ({
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
            Donation Templates
          </h1>
          <p className="text-slate-600">
            Save and reuse your favorite donation allocation configurations
          </p>
        </div>
        <Button asChild>
          <Link href="/donate">
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>

      {/* Personal Templates Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-medium text-slate-900">Your Templates</h2>
          <span className="text-sm text-slate-500">({personalTemplates.length})</span>
        </div>

        {personalTemplates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Layers className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No saved templates yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Create a donation allocation and save it as a template for quick reuse
              </p>
              <Button asChild className="mt-4">
                <Link href="/donate">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Donation
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalTemplates.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <Layers className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {/* Saved Amount & Frequency badges */}
                  {(template.amountCents || template.frequency) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {template.amountCents && (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(template.amountCents)}
                        </Badge>
                      )}
                      {template.frequency && (
                        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {template.frequency === "one-time" ? "One-time" : template.frequency}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Allocation Breakdown */}
                  <div className="space-y-2">
                    {template.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {item.type === "nonprofit" ? (
                            <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          ) : (
                            <Tag className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          )}
                          <span className="text-sm text-slate-600 truncate">
                            {item.targetName}
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
                    Last updated {formatDate(template.updatedAt)}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100">
                    <Button variant="default" size="sm" className="flex-1" asChild>
                      <Link href={`/donate?template=${template.id}&type=personal`}>
                        <Heart className="mr-2 h-4 w-4" />
                        Use Template
                      </Link>
                    </Button>
                    <DeleteTemplateButton templateId={template.id} templateName={template.name} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Organization Templates Section */}
      {userData?.organization_id && orgTemplates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-medium text-slate-900">Organization Templates</h2>
            <span className="text-sm text-slate-500">({orgTemplates.length})</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orgTemplates.map((template) => (
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
                      <Link href={`/donate?template=${template.id}&type=org`}>
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
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-1">
              How templates work
            </h3>
            <p className="text-sm text-blue-700">
              Templates let you save your favorite allocation configurations so you can quickly
              reuse them for future donations. On the Make a Donation page, click &quot;Save as Template&quot;
              to save your current allocation. You can optionally save the donation amount and frequency too.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
