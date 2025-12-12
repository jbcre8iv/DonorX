import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WidgetForm } from "../widget-form";
import type { Nonprofit } from "@/types/database";

export const metadata = {
  title: "Create Widget - Admin",
};

export default async function NewWidgetPage() {
  const supabase = await createClient();

  // Fetch approved nonprofits for dropdown
  const { data: nonprofits } = await supabase
    .from("nonprofits")
    .select("id, name, logo_url")
    .eq("status", "approved")
    .order("name");

  const typedNonprofits = (nonprofits || []) as Nonprofit[];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Link */}
      <Link
        href="/admin/widgets"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Widgets
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Create Widget</h1>
        <p className="text-slate-600">
          Create an embeddable donation form for a nonprofit
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Widget Settings</CardTitle>
          <CardDescription>
            Configure how the donation widget will appear and behave
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WidgetForm nonprofits={typedNonprofits} />
        </CardContent>
      </Card>
    </div>
  );
}
