import Link from "next/link";
import { FileText, Plus, Calendar, Users, DollarSign, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Impact Reports",
};

export default async function ImpactReportsPage() {
  const supabase = await createClient();

  // Get sample nonprofit (in production, filter by user's nonprofit)
  const { data: nonprofits } = await supabase
    .from("nonprofits")
    .select("id, name")
    .eq("status", "approved")
    .limit(1);

  const nonprofit = nonprofits?.[0];

  if (!nonprofit) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No nonprofit found</p>
        </div>
      </div>
    );
  }

  // Get impact reports for this nonprofit
  const { data: reports } = await supabase
    .from("impact_reports")
    .select("*")
    .eq("nonprofit_id", nonprofit.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Impact Reports</h1>
          <p className="text-slate-600">Share updates with your donors</p>
        </div>
        <Button asChild>
          <Link href="/nonprofit/reports/new">
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Link>
        </Button>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports ({(reports || []).length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!reports || reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No impact reports yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Create your first report to share with donors
              </p>
              <Button className="mt-4" asChild>
                <Link href="/nonprofit/reports/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Report
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-200 p-4 gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{report.title}</h3>
                    {report.content && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {report.content}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.report_date || report.created_at)}
                      </span>
                      {report.funds_used_cents && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(report.funds_used_cents)} used
                        </span>
                      )}
                      {report.people_served && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {report.people_served.toLocaleString()} served
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="success">Published</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      disabled
                    >
                      <Trash2 className="h-4 w-4" />
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
