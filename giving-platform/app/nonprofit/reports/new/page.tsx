"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createImpactReport } from "../actions";

export default function NewImpactReportPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // In production, this would come from user's nonprofit association
  const nonprofitId = "demo-nonprofit-id";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createImpactReport(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/nonprofit/reports");
      }
    });
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
            <input type="hidden" name="nonprofit_id" value={nonprofitId} />

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
                <Button type="submit" disabled={isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  {isPending ? "Publishing..." : "Publish Report"}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Once published, this report will be visible to all donors who have
                supported your organization.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
