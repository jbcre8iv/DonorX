"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createImpactReport } from "../../actions";

// Note: This page needs the nonprofit ID passed to it
// In production, we should make this a server component that fetches the nonprofit ID

interface NewReportFormProps {
  nonprofitId: string;
}

function NewReportForm({ nonprofitId }: NewReportFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const fundsUsed = formData.get("funds_used") as string;
    const peopleServed = formData.get("people_served") as string;
    const reportDate = formData.get("report_date") as string;

    try {
      const result = await createImpactReport(nonprofitId, {
        title,
        content: content || null,
        funds_used_cents: fundsUsed ? Math.round(parseFloat(fundsUsed) * 100) : null,
        people_served: peopleServed ? parseInt(peopleServed, 10) : null,
        report_date: reportDate || null,
      });

      if (!result.success) {
        setError(result.error || "Failed to create report");
        return;
      }

      router.push("/nonprofit/reports");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Link */}
      <Link
        href="/nonprofit/reports"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Reports
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Create Impact Report
        </h1>
        <p className="text-slate-600">
          Share an update with your donors about your work
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <Input
                name="title"
                placeholder="e.g., Q4 2024 Impact Summary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Report Date
              </label>
              <Input
                name="report_date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Content
              </label>
              <textarea
                name="content"
                rows={6}
                placeholder="Share details about your impact, programs, and how donations are being used..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Funds Used ($)
                </label>
                <Input
                  name="funds_used"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 25000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  How much funding was used in this period
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  People Served
                </label>
                <Input
                  name="people_served"
                  type="number"
                  min="0"
                  placeholder="e.g., 500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Number of people impacted
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Publish Report
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Once published, this report will be visible on your public profile page.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// This is a client component wrapper that gets the nonprofit ID from localStorage
// In a real implementation, this should be a server component or get the ID from context
export default function NewImpactReportPage() {
  const [nonprofitId, setNonprofitId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Fetch the nonprofit ID for the current user
    async function fetchNonprofitId() {
      try {
        const response = await fetch("/api/nonprofit/current");
        if (!response.ok) {
          throw new Error("Failed to fetch nonprofit");
        }
        const data = await response.json();
        setNonprofitId(data.nonprofitId);
      } catch {
        setError("Could not load your nonprofit. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    }

    fetchNonprofitId();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !nonprofitId) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Link
          href="/nonprofit/reports"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Link>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error || "Unable to create report. Please try again."}
        </div>
      </div>
    );
  }

  return <NewReportForm nonprofitId={nonprofitId} />;
}
