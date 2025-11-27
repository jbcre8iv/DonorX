"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, Star, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Recommendation {
  id: string;
  reason: string;
  score: number;
  nonprofit: {
    id: string;
    name: string;
    mission: string;
    category: string;
    featured: boolean;
  };
}

interface SmartRecommendationsProps {
  onSelectNonprofit?: (nonprofitId: string) => void;
}

export function SmartRecommendations({ onSelectNonprofit }: SmartRecommendationsProps) {
  const [interests, setInterests] = useState("");
  const [budget, setBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [explanation, setExplanation] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!interests.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests,
          budget: budget || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setExplanation(data.explanation || "");
    } catch (error) {
      console.error("Recommendations error:", error);
      setRecommendations([]);
      setExplanation("Unable to generate recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-600";
    if (score >= 6) return "text-blue-600";
    return "text-slate-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          AI-Powered Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              What causes are you passionate about?
            </label>
            <Input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g., education, climate change, helping children"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Budget (optional)
            </label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., 5000"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!interests.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finding matches...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Recommendations
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {hasSearched && !isLoading && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {explanation && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-sm text-emerald-800">{explanation}</p>
              </div>
            )}

            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 truncate">
                            {rec.nonprofit.name}
                          </h4>
                          {rec.nonprofit.featured && (
                            <Badge variant="secondary" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {rec.nonprofit.category}
                        </p>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          {rec.nonprofit.mission}
                        </p>
                        <p className="text-sm text-emerald-700 mt-2 italic">
                          &quot;{rec.reason}&quot;
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`flex items-center gap-1 ${getScoreColor(rec.score)}`}
                        >
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-medium">{rec.score}/10</span>
                        </div>
                        {onSelectNonprofit ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSelectNonprofit(rec.nonprofit.id)}
                          >
                            Add
                          </Button>
                        ) : (
                          <Link href={`/directory/${rec.nonprofit.id}`}>
                            <Button size="sm" variant="outline">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500">
                  No recommendations found. Try adjusting your interests.
                </p>
              </div>
            )}

            {recommendations.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Recommendations
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
