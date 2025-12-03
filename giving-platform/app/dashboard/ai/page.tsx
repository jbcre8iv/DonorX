import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SmartRecommendations } from "@/components/ai/smart-recommendations";
import { ImpactSummary } from "@/components/ai/impact-summary";
import { AllocationAdvisor } from "@/components/ai/allocation-advisor";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "AI Tools",
};

export default async function AIToolsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-600 animate-pulse" />
          AI-Powered Tools
        </h1>
        <p className="text-slate-600">
          Use AI to discover nonprofits, plan allocations, and understand your impact
        </p>
      </div>

      {/* AI Tools Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SmartRecommendations />
        <AllocationAdvisor />
      </div>

      {/* Impact Summary */}
      <ImpactSummary />
    </div>
  );
}
