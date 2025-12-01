import { createClient } from "@/lib/supabase/server";
import { anthropic, SYSTEM_PROMPTS } from "@/lib/ai/client";

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

    const { messages, feature = "givingConcierge" } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // Get system prompt based on feature
    const systemPrompt =
      SYSTEM_PROMPTS[feature as keyof typeof SYSTEM_PROMPTS] ||
      SYSTEM_PROMPTS.givingConcierge;

    // Fetch nonprofits for context
    const { data: nonprofits } = await supabase
      .from("nonprofits")
      .select(`
        id,
        name,
        mission,
        city,
        state,
        category:categories(name)
      `)
      .eq("status", "approved")
      .limit(50);

    // Build context from nonprofits with IDs for card rendering
    const nonprofitContext = nonprofits
      ?.map((np) => {
        const cat = np.category as { name: string } | { name: string }[] | null;
        const category = Array.isArray(cat)
          ? cat[0]?.name
          : cat?.name;
        const location = np.city && np.state
          ? `${np.city}, ${np.state}`
          : np.city || np.state || "National";
        return `- ID: ${np.id} | Name: ${np.name} | Category: ${category || "General"} | Location: ${location} | Mission: ${np.mission || "No mission provided"}`;
      })
      .join("\n");

    const contextMessage = `Available nonprofits on DonorX (use [[NONPROFIT:id:name]] format when recommending):\n${nonprofitContext}`;

    // Build messages array with context
    const apiMessages: Array<{ role: "user" | "assistant"; content: string }> = [
      {
        role: "user",
        content: `Here's context about available nonprofits:\n${contextMessage}`,
      },
      {
        role: "assistant",
        content:
          "I understand. I have information about these nonprofits and can help you find the right fit for your giving goals.",
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Create streaming response
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    // Convert to ReadableStream for Next.js
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = encoder.encode(event.delta.text);
              controller.enqueue(chunk);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
