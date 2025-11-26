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

    const { amount, goals, selectedNonprofits, preferences } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Fetch all approved nonprofits
    const { data: nonprofits } = await supabase
      .from("nonprofits")
      .select(`
        id,
        name,
        mission,
        featured,
        category:categories(name, slug)
      `)
      .eq("status", "approved");

    // Fetch categories
    const { data: categories } = await supabase
      .from("categories")
      .select("name, slug, description");

    // Build context
    const nonprofitList = nonprofits
      ?.map((np) => {
        const category = Array.isArray(np.category)
          ? np.category[0]
          : np.category;
        return `- ${np.name} (${category?.name || "General"}): ${np.mission || "No mission"}${np.featured ? " [Featured]" : ""}`;
      })
      .join("\n");

    const categoryList = categories
      ?.map((c) => `- ${c.name}: ${c.description}`)
      .join("\n");

    const selectedList =
      selectedNonprofits?.length > 0
        ? `Currently selected nonprofits: ${selectedNonprofits.map((np: { name: string }) => np.name).join(", ")}`
        : "No nonprofits selected yet.";

    // Build user prompt
    const userPrompt = `A donor wants advice on how to allocate their donation. Here are the details:

Donation Amount: $${amount.toLocaleString()}
Giving Goals: ${goals || "Not specified"}
Preferences: ${preferences || "None specified"}
${selectedList}

Available Categories:
${categoryList}

Available Nonprofits:
${nonprofitList}

Please provide allocation advice in the following JSON format:
{
  "strategy": "Brief description of your recommended allocation strategy",
  "allocations": [
    {
      "name": "Nonprofit or category name",
      "percentage": 30,
      "amount": 3000,
      "reason": "Why this allocation makes sense"
    }
  ],
  "tips": [
    "Helpful tip 1",
    "Helpful tip 2"
  ],
  "alternativeStrategies": [
    {
      "name": "Strategy name",
      "description": "Brief description"
    }
  ]
}

Ensure percentages sum to 100 and amounts match the donation amount. Provide 3-6 allocation recommendations.`;

    // Get AI advice
    const response = await createMessage(SYSTEM_PROMPTS.allocationAdvisor, userPrompt);

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        error: "Unable to generate allocation advice",
      });
    }

    const advice = JSON.parse(jsonMatch[0]);

    return NextResponse.json(advice);
  } catch (error) {
    console.error("Allocation advice API error:", error);
    return NextResponse.json(
      { error: "Failed to generate allocation advice" },
      { status: 500 }
    );
  }
}
