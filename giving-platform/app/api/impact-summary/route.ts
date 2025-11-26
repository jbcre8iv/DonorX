import { createClient } from "@/lib/supabase/server";
import { createMessage, SYSTEM_PROMPTS } from "@/lib/ai/client";
import { NextResponse } from "next/server";
import { formatCurrency } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { nonprofitId, reportIds } = await request.json();

    // Get impact reports
    let query = supabase
      .from("impact_reports")
      .select(`
        id,
        title,
        content,
        funds_used_cents,
        people_served,
        report_date,
        nonprofit:nonprofits(name, mission)
      `)
      .order("created_at", { ascending: false });

    if (nonprofitId) {
      query = query.eq("nonprofit_id", nonprofitId);
    } else if (reportIds && reportIds.length > 0) {
      query = query.in("id", reportIds);
    } else {
      // Get reports from nonprofits the user has donated to
      const { data: allocations } = await supabase
        .from("allocations")
        .select(`
          nonprofit_id,
          donation:donations!inner(user_id, status)
        `)
        .eq("donation.user_id", user.id)
        .eq("donation.status", "completed");

      const nonprofitIds = [...new Set(allocations?.map((a) => a.nonprofit_id) || [])];

      if (nonprofitIds.length === 0) {
        return NextResponse.json({
          summary: "You haven't donated to any nonprofits yet. Start giving to see impact summaries!",
        });
      }

      query = query.in("nonprofit_id", nonprofitIds);
    }

    const { data: reports } = await query.limit(20);

    if (!reports || reports.length === 0) {
      return NextResponse.json({
        summary: "No impact reports available yet. Check back soon!",
      });
    }

    // Build context from reports
    const reportsContext = reports
      .map((report) => {
        const nonprofit = Array.isArray(report.nonprofit)
          ? report.nonprofit[0]
          : report.nonprofit;

        return `Organization: ${nonprofit?.name || "Unknown"}
Report: ${report.title}
Date: ${report.report_date || "Not specified"}
Content: ${report.content || "No details provided"}
Funds Used: ${report.funds_used_cents ? formatCurrency(report.funds_used_cents) : "Not specified"}
People Served: ${report.people_served?.toLocaleString() || "Not specified"}`;
      })
      .join("\n\n---\n\n");

    // Get AI summary
    const userPrompt = `Please summarize the following impact reports from nonprofits. Create a compelling, cohesive narrative that highlights the key achievements, metrics, and human impact. Focus on connecting the donor's contributions to real outcomes.

Impact Reports:
${reportsContext}

Provide a summary in 2-3 paragraphs that:
1. Highlights the most significant achievements and metrics
2. Tells a human story of impact
3. Acknowledges the collective difference being made`;

    const summary = await createMessage(SYSTEM_PROMPTS.impactSummarizer, userPrompt);

    // Calculate aggregate stats
    const totalFundsUsed = reports.reduce(
      (sum, r) => sum + (r.funds_used_cents || 0),
      0
    );
    const totalPeopleServed = reports.reduce(
      (sum, r) => sum + (r.people_served || 0),
      0
    );
    const uniqueNonprofits = new Set(
      reports.map((r) => {
        const np = Array.isArray(r.nonprofit) ? r.nonprofit[0] : r.nonprofit;
        return np?.name;
      })
    ).size;

    return NextResponse.json({
      summary,
      stats: {
        totalReports: reports.length,
        totalFundsUsed,
        totalPeopleServed,
        uniqueNonprofits,
      },
    });
  } catch (error) {
    console.error("Impact summary API error:", error);
    return NextResponse.json(
      { error: "Failed to generate impact summary" },
      { status: 500 }
    );
  }
}
