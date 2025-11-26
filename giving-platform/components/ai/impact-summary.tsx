"use client";

import { useState } from "react";
import { Sparkles, Loader2, Users, DollarSign, FileText, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface ImpactStats {
  totalReports: number;
  totalFundsUsed: number;
  totalPeopleServed: number;
  uniqueNonprofits: number;
}

interface ImpactSummaryProps {
  nonprofitId?: string;
  className?: string;
}

export function ImpactSummary({ nonprofitId, className }: ImpactSummaryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSummary = async () => {
    setIsLoading(true);
    setHasGenerated(true);

    try {
      const response = await fetch("/api/impact-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonprofitId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
      setStats(data.stats);
    } catch (error) {
      console.error("Impact summary error:", error);
      setSummary("Unable to generate impact summary. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          AI Impact Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasGenerated ? (
          <div className="text-center py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-slate-600 mb-4">
              Generate an AI-powered summary of your impact across all nonprofits
              you've supported.
            </p>
            <Button onClick={generateSummary} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing impact...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600">Analyzing your impact data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-700 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Funds Used</span>
                  </div>
                  <p className="text-xl font-semibold text-emerald-900">
                    {formatCurrency(stats.totalFundsUsed)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">People Served</span>
                  </div>
                  <p className="text-xl font-semibold text-blue-900">
                    {stats.totalPeopleServed.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-2 text-purple-700 mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Organizations</span>
                  </div>
                  <p className="text-xl font-semibold text-purple-900">
                    {stats.uniqueNonprofits}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Reports</span>
                  </div>
                  <p className="text-xl font-semibold text-amber-900">
                    {stats.totalReports}
                  </p>
                </div>
              </div>
            )}

            {/* AI Summary */}
            {summary && (
              <div className="prose prose-sm max-w-none">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-700 whitespace-pre-wrap">{summary}</p>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={generateSummary}
              disabled={isLoading}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate Summary
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
