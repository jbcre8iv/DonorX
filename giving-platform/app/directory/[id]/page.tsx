import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe, Building2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Nonprofit, ImpactReport } from "@/types/database";

interface NonprofitPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NonprofitPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: nonprofit } = await supabase
    .from("nonprofits")
    .select("name, mission")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!nonprofit) {
    return { title: "Nonprofit Not Found" };
  }

  return {
    title: nonprofit.name,
    description: nonprofit.mission,
  };
}

export default async function NonprofitPage({ params }: NonprofitPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch nonprofit with category
  const { data: nonprofit } = await supabase
    .from("nonprofits")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!nonprofit) {
    notFound();
  }

  // Fetch impact reports for this nonprofit
  const { data: impactReports } = await supabase
    .from("impact_reports")
    .select("*")
    .eq("nonprofit_id", id)
    .order("report_date", { ascending: false })
    .limit(5);

  const typedNonprofit = nonprofit as Nonprofit;
  const typedReports = (impactReports || []) as ImpactReport[];

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/directory"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          {typedNonprofit.logo_url ? (
            <img
              src={typedNonprofit.logo_url}
              alt={`${typedNonprofit.name} logo`}
              className="h-24 w-24 rounded-xl object-contain border border-slate-200"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-3xl">
              {typedNonprofit.name.charAt(0)}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-slate-900">
                {typedNonprofit.name}
              </h1>
              {typedNonprofit.featured && (
                <Badge variant="success">Featured</Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {typedNonprofit.category && (
                <Badge variant="secondary">
                  {typedNonprofit.category.icon && (
                    <span className="mr-1">{typedNonprofit.category.icon}</span>
                  )}
                  {typedNonprofit.category.name}
                </Badge>
              )}
              {typedNonprofit.ein && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  EIN: {typedNonprofit.ein}
                </span>
              )}
            </div>

            {typedNonprofit.website && (
              <a
                href={typedNonprofit.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                <Globe className="h-4 w-4" />
                {typedNonprofit.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button asChild className="flex-1 sm:flex-none">
              <Link href={`/donate?nonprofit=${typedNonprofit.id}`}>
                Donate Now
              </Link>
            </Button>
          </div>
        </div>

        {/* Mission */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 leading-relaxed">
              {typedNonprofit.mission || typedNonprofit.description || "No mission statement available."}
            </p>
          </CardContent>
        </Card>

        {/* Description (if different from mission) */}
        {typedNonprofit.description && typedNonprofit.description !== typedNonprofit.mission && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 leading-relaxed">
                {typedNonprofit.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Impact Reports */}
        {typedReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {typedReports.map((report) => (
                  <div key={report.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-slate-900 mb-2">
                      {report.title}
                    </h3>
                    {report.content && (
                      <p className="text-sm text-slate-600 mb-3">
                        {report.content}
                      </p>
                    )}
                    <div className="flex gap-6 text-sm">
                      {report.funds_used_cents && (
                        <div>
                          <span className="text-slate-500">Funds Used: </span>
                          <span className="font-medium text-slate-900">
                            ${(report.funds_used_cents / 100).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {report.people_served && (
                        <div>
                          <span className="text-slate-500">People Served: </span>
                          <span className="font-medium text-slate-900">
                            {report.people_served.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {report.report_date && (
                        <div className="text-slate-500">
                          {new Date(report.report_date).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">
            Ready to make a difference with {typedNonprofit.name}?
          </p>
          <Button asChild size="lg">
            <Link href={`/donate?nonprofit=${typedNonprofit.id}`}>
              Donate to {typedNonprofit.name}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
