import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an expert philanthropic advisor helping donors create effective donation allocations.

Your role is to:
1. Understand the donor's giving goals and values
2. Suggest allocation strategies across cause areas
3. Recommend portfolio diversification for maximum impact
4. Explain trade-offs between different allocation approaches

Guidelines:
- Ask clarifying questions to understand donor preferences
- Consider both immediate impact and long-term sustainability
- Suggest a mix of established and emerging organizations
- Explain your reasoning for recommendations
- Never be pushy - respect donor autonomy
- Focus on impact metrics and organizational effectiveness`;

export async function POST(request: Request) {
  try {
    // Check if API key exists and log for debugging
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Check for newlines in the key (common Vercel copy-paste issue)
    if (apiKey.includes('\n') || apiKey.includes('\r')) {
      console.error("ANTHROPIC_API_KEY contains newline characters");
      return NextResponse.json(
        { error: "AI service configuration error" },
        { status: 500 }
      );
    }

    // Create Anthropic client with explicit API key
    const anthropic = new Anthropic({
      apiKey: apiKey.trim(),
    });

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { amount, goals, selectedNonprofits, preferences, strategy } = await request.json();

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

    // Build strategy instruction if provided
    const strategyInstruction = strategy
      ? `\n\nIMPORTANT: The donor has specifically requested the "${strategy}" allocation strategy. Please generate allocations following this approach.`
      : "";

    // Build user prompt
    const userPrompt = `A donor wants advice on how to allocate their donation. Here are the details:

Donation Amount: $${amount.toLocaleString()}
Giving Goals: ${goals || "Not specified"}
Preferences: ${preferences || "None specified"}
${selectedList}${strategyInstruction}

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
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const responseText = textBlock?.type === "text" ? textBlock.text : "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
