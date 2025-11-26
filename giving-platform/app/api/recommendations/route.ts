import { createClient } from "@/lib/supabase/server";
import { createMessage, SYSTEM_PROMPTS } from "@/lib/ai/client";
import { NextResponse } from "next/server";

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

    const { interests, budget, preferences } = await request.json();

    // Fetch all approved nonprofits
    const { data: nonprofits } = await supabase
      .from("nonprofits")
      .select(`
        id,
        name,
        mission,
        description,
        website,
        featured,
        category:categories(name, slug)
      `)
      .eq("status", "approved");

    if (!nonprofits || nonprofits.length === 0) {
      return NextResponse.json({ recommendations: [], explanation: "No nonprofits available" });
    }

    // Build context from nonprofits
    const nonprofitList = nonprofits
      .map((np) => {
        const category = Array.isArray(np.category)
          ? np.category[0]
          : np.category;
        return `ID: ${np.id}
Name: ${np.name}
Category: ${category?.name || "General"}
Mission: ${np.mission || "Not specified"}
Description: ${np.description || "Not provided"}
Featured: ${np.featured ? "Yes" : "No"}`;
      })
      .join("\n\n---\n\n");

    // Build user preferences prompt
    const userPrompt = `A donor has the following preferences:

Interests: ${interests || "Not specified"}
Budget: ${budget ? `$${budget}` : "Not specified"}
Additional Preferences: ${preferences || "None"}

Based on these preferences, recommend 3-5 nonprofits from the list below. For each recommendation, provide:
1. The nonprofit ID (exactly as shown)
2. Why this nonprofit matches the donor's interests
3. A relevance score (1-10)

Format your response as JSON:
{
  "recommendations": [
    {
      "id": "nonprofit-id-here",
      "reason": "Why this matches the donor's interests",
      "score": 8
    }
  ],
  "explanation": "A brief overview of your recommendation strategy"
}

Available Nonprofits:
${nonprofitList}`;

    // Get AI recommendations
    const response = await createMessage(
      SYSTEM_PROMPTS.nonprofitMatcher,
      userPrompt
    );

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        recommendations: [],
        explanation: "Unable to generate recommendations",
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Enrich recommendations with full nonprofit data
    const enrichedRecommendations = parsed.recommendations
      .map((rec: { id: string; reason: string; score: number }) => {
        const nonprofit = nonprofits.find((np) => np.id === rec.id);
        if (!nonprofit) return null;

        const category = Array.isArray(nonprofit.category)
          ? nonprofit.category[0]
          : nonprofit.category;

        return {
          ...rec,
          nonprofit: {
            id: nonprofit.id,
            name: nonprofit.name,
            mission: nonprofit.mission,
            category: category?.name || "General",
            featured: nonprofit.featured,
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      recommendations: enrichedRecommendations,
      explanation: parsed.explanation,
    });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
