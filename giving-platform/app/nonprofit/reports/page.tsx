import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Calendar, Users, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DeleteReportButton } from "./delete-report-button";
import type { Nonprofit, ImpactReport } from "@/types/database";

export const metadata = {
  title: "Impact Reports - Nonprofit Portal",
};

export default async function ImpactReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get nonprofit from user's nonprofit_users record
  const { data: nonprofitUser } = await supabase
    .from("nonprofit_users")
    .select(`
      role,
      nonprofit:nonprofits(*)
    `)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser) {
    redirect("/nonprofit");
  }

  const nonprofit = nonprofitUser.nonprofit as unknown as Nonprofit;
  const canEdit = ["admin", "editor"].includes(nonprofitUser.role);
  const isAdmin = nonprofitUser.role === "admin";

  // Get impact reports for this nonprofit
  const { data: reports } = await supabase
    .from("impact_reports")
    .select("*")
    .eq("nonprofit_id", nonprofit.id)
    .order("created_at", { ascending: false });

  const typedReports = (reports || []) as ImpactReport[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Impact Reports</h1>
          <p className="text-slate-600">Share updates with your donors</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/nonprofit/reports/new">
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Link>
          </Button>
        )}
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports ({typedReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {typedReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No impact reports yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Create your first report to share with donors
              </p>
              {canEdit && (
                <Button className="mt-4" asChild>
                  <Link href="/nonprofit/reports/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Report
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {typedReports.map((report) => (
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
                  <div className="flex gap-2 items-center">
                    <Badge variant="success">Published</Badge>
                    {canEdit && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/nonprofit/reports/${report.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    )}
                    {isAdmin && <DeleteReportButton reportId={report.id} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Tips for Effective Impact Reports
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                <strong>Be specific:</strong> Include concrete numbers and outcomes
              </li>
              <li>
                <strong>Tell stories:</strong> Share individual success stories when possible
              </li>
              <li>
                <strong>Show progress:</strong> Compare results to previous periods
              </li>
              <li>
                <strong>Thank donors:</strong> Acknowledge their role in making impact possible
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
