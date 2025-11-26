import { redirect } from "next/navigation";
import Link from "next/link";
import { Newspaper, Building2, Calendar, Users, DollarSign, ChevronRight, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Impact Feed",
};

export default async function ImpactPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the nonprofits the user has donated to
  const { data: userAllocations } = await supabase
    .from("allocations")
    .select(`
      nonprofit_id,
      donation:donations!inner(user_id, status)
    `)
    .eq("donation.user_id", user.id)
    .eq("donation.status", "completed")
    .not("nonprofit_id", "is", null);

  // Get unique nonprofit IDs
  const nonprofitIds = [...new Set(
    (userAllocations || [])
      .map((a: { nonprofit_id: string | null }) => a.nonprofit_id)
      .filter(Boolean)
  )];

  // Fetch impact reports from those nonprofits
  let impactReports: Array<{
    id: string;
    title: string;
    content: string | null;
    funds_used_cents: number | null;
    people_served: number | null;
    media_urls: string[] | null;
    report_date: string | null;
    created_at: string;
    nonprofit: { id: string; name: string; logo_url: string | null } | null;
  }> = [];

  if (nonprofitIds.length > 0) {
    const { data: reports } = await supabase
      .from("impact_reports")
      .select(`
        id,
        title,
        content,
        funds_used_cents,
        people_served,
        media_urls,
        report_date,
        created_at,
        nonprofit:nonprofits(id, name, logo_url)
      `)
      .in("nonprofit_id", nonprofitIds)
      .order("created_at", { ascending: false })
      .limit(20);

    impactReports = (reports || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      content: r.content as string | null,
      funds_used_cents: r.funds_used_cents as number | null,
      people_served: r.people_served as number | null,
      media_urls: r.media_urls as string[] | null,
      report_date: r.report_date as string | null,
      created_at: r.created_at as string,
      nonprofit: Array.isArray(r.nonprofit) ? r.nonprofit[0] : r.nonprofit,
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Impact Feed</h1>
        <p className="text-slate-600">
          See the difference your donations are making
        </p>
      </div>

      {/* Impact Reports */}
      {impactReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No impact reports yet</p>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              When the nonprofits you support share updates about their work,
              you&apos;ll see them here.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/directory">
                Browse Nonprofits
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {impactReports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                      {report.nonprofit?.logo_url ? (
                        <img
                          src={report.nonprofit.logo_url}
                          alt={report.nonprofit.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-blue-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <span>{report.nonprofit?.name || "Unknown"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(report.report_date || report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  {report.content && (
                    <p className="text-slate-600 mb-4 line-clamp-4">
                      {report.content}
                    </p>
                  )}

                  {/* Stats */}
                  {(report.funds_used_cents || report.people_served) && (
                    <div className="flex flex-wrap gap-4 mb-4">
                      {report.funds_used_cents && (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700">
                            {formatCurrency(report.funds_used_cents)} used
                          </span>
                        </div>
                      )}
                      {report.people_served && (
                        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">
                            {report.people_served.toLocaleString()} people served
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Media */}
                  {report.media_urls && report.media_urls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {report.media_urls.slice(0, 3).map((url, idx) => (
                        <div
                          key={idx}
                          className="flex-shrink-0 h-32 w-48 rounded-lg bg-slate-100 overflow-hidden"
                        >
                          <img
                            src={url}
                            alt={`Impact media ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      {report.media_urls.length > 3 && (
                        <div className="flex-shrink-0 h-32 w-32 rounded-lg bg-slate-100 flex items-center justify-center">
                          <span className="text-sm text-slate-500">
                            +{report.media_urls.length - 3} more
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 px-6 py-3 bg-slate-50">
                  <Link
                    href={`/directory/${report.nonprofit?.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View nonprofit profile
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-1">
              About Impact Reports
            </h3>
            <p className="text-sm text-blue-700">
              Nonprofits you support can share updates about how they&apos;re using
              donations to make a difference. These reports help you see the
              real-world impact of your generosity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
