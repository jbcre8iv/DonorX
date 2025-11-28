"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export interface ApplicationData {
  name: string;
  ein?: string;
  website?: string;
  description?: string;
  mission?: string;
  category_id?: string;
  logo_url?: string;
  contact_name: string;
  contact_email: string;
}

export async function submitApplication(data: ApplicationData) {
  const supabase = await createClient();

  // Validate required fields
  if (!data.name || !data.contact_name || !data.contact_email) {
    return { error: "Organization name, contact name, and email are required" };
  }

  // Check if nonprofit with same name already exists
  const { data: existing } = await supabase
    .from("nonprofits")
    .select("id, name")
    .ilike("name", data.name)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "An organization with this name already exists in our directory" };
  }

  // Use admin client to bypass RLS for inserting pending applications
  const adminSupabase = createAdminClient();

  // Insert as pending
  const { error } = await adminSupabase.from("nonprofits").insert({
    name: data.name,
    ein: data.ein || null,
    website: data.website || null,
    description: data.description || null,
    mission: data.mission || null,
    category_id: data.category_id || null,
    logo_url: data.logo_url || null,
    status: "pending",
  });

  if (error) {
    console.error("Application submission error:", error);
    return { error: "Failed to submit application. Please try again." };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  return { success: true };
}

// Re-export the extractNonprofitInfo function for the apply page
async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (response.ok) {
      return await response.text();
    }
  } catch {
    // Ignore fetch errors for secondary pages
  }
  return null;
}

function extractBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

export interface ExtractedNonprofitInfo {
  name?: string;
  logoUrl?: string;
  description?: string;
  mission?: string;
  suggestedCategory?: string;
  error?: string;
}

export interface ExistingNonprofitCheck {
  exists: boolean;
  nonprofit?: {
    id: string;
    name: string;
    status: string;
  };
}

export async function checkNonprofitExists(
  name?: string,
  ein?: string,
  website?: string
): Promise<ExistingNonprofitCheck> {
  const supabase = await createClient();

  // Check by name (case-insensitive)
  if (name) {
    const { data: byName } = await supabase
      .from("nonprofits")
      .select("id, name, status")
      .ilike("name", name)
      .limit(1);

    if (byName && byName.length > 0) {
      return {
        exists: true,
        nonprofit: byName[0],
      };
    }
  }

  // Check by EIN (exact match)
  if (ein) {
    const normalizedEin = ein.replace(/[^0-9]/g, "");
    const { data: byEin } = await supabase
      .from("nonprofits")
      .select("id, name, status")
      .or(`ein.eq.${normalizedEin},ein.eq.${ein}`)
      .limit(1);

    if (byEin && byEin.length > 0) {
      return {
        exists: true,
        nonprofit: byEin[0],
      };
    }
  }

  // Check by website (normalize and compare)
  if (website) {
    const normalizedWebsite = website
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");

    const { data: allNonprofits } = await supabase
      .from("nonprofits")
      .select("id, name, status, website")
      .not("website", "is", null);

    if (allNonprofits) {
      const match = allNonprofits.find((np) => {
        if (!np.website) return false;
        const npWebsite = np.website
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/$/, "");
        return npWebsite === normalizedWebsite;
      });

      if (match) {
        return {
          exists: true,
          nonprofit: {
            id: match.id,
            name: match.name,
            status: match.status,
          },
        };
      }
    }
  }

  return { exists: false };
}

export async function extractNonprofitInfo(websiteUrl: string): Promise<ExtractedNonprofitInfo> {
  if (!websiteUrl) {
    return { error: "Website URL is required" };
  }

  try {
    const baseUrl = extractBaseUrl(websiteUrl);

    // Fetch the main page and common about/mission pages in parallel
    const pagesToTry = [
      websiteUrl,
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/mission`,
      `${baseUrl}/who-we-are`,
      `${baseUrl}/our-mission`,
      `${baseUrl}/what-we-do`,
    ];

    const pagePromises = pagesToTry.map(fetchPageContent);
    const pageResults = await Promise.all(pagePromises);

    // Combine all successfully fetched content
    const allContent: string[] = [];
    pageResults.forEach((content, index) => {
      if (content) {
        allContent.push(`\n--- PAGE: ${pagesToTry[index]} ---\n${content.slice(0, 30000)}`);
      }
    });

    if (allContent.length === 0) {
      return { error: "Failed to fetch any pages from the website" };
    }

    // Combine content, limiting total size
    const combinedHtml = allContent.join("\n").slice(0, 100000);

    // Use Claude to extract nonprofit information
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are extracting nonprofit information from website HTML. The content may come from multiple pages of the same site.

IMPORTANT: Many modern websites (Wix, Squarespace, etc.) render content via JavaScript, so the main body may be empty. Look carefully in these locations:

1. **META TAGS** (highest priority for JS-rendered sites):
   - og:title, og:description, og:image
   - twitter:title, twitter:description, twitter:image
   - meta name="description"
   - meta name="keywords"

2. **STRUCTURED DATA**:
   - JSON-LD scripts (type: "Organization", "NonProfit", "NGO")
   - Schema.org markup

3. **PAGE CONTENT** (if available):
   - Header/nav text, navigation menu items
   - Hero sections
   - About sections
   - Any visible text content

4. **INFER FROM CONTEXT**:
   - Domain name often hints at the organization's focus
   - Image filenames and alt text
   - URL paths (e.g., /donate, /events, /programs)

Extract (ALWAYS provide values for ALL fields - infer if not explicitly stated):
1. **Organization Name**: Look in og:title, page title, JSON-LD, or prominent headers
2. **Logo URL**: Look in og:image, twitter:image, JSON-LD logo, link rel="icon", apple-touch-icon. Convert relative URLs to absolute using base: ${websiteUrl}
3. **Short Description**: 1-2 sentences about what they do. Use og:description, meta description, or INFER from organization name and any context clues
4. **Mission Statement**: Their mission/purpose. If not explicitly found, GENERATE a plausible mission statement based on the organization name, description, and category (e.g., "812 MX Ministry exists to share the love of Christ through the sport of motocross, providing a welcoming community for riders and families.")
5. **Category**: ALWAYS select EXACTLY ONE from this list (use exact spelling): Animal Welfare, Arts & Culture, Disaster Relief, Education, Environment, Healthcare, Housing, Human Rights, Hunger Relief, Military Veterans, Religious, Sports Ministry, Youth Development. Infer from organization name and context:
   - Military/veteran organizations → "Military Veterans"
   - Food banks, hunger relief → "Hunger Relief"
   - Medical/health → "Healthcare"
   - Animal rescue/shelters → "Animal Welfare"
   - Faith-based sports ministries → "Sports Ministry"
   - Churches, missions, faith-based charities → "Religious"
   - Civil rights, advocacy → "Human Rights"
   - Homeless services, affordable housing → "Housing"

CRITICAL RULES:
- NEVER return null for category - always select from the exact list above
- NEVER return null for mission - generate one if not found
- The category MUST be one of the 13 exact options listed above (case-sensitive)
- Be creative and use all context clues available

Respond ONLY with valid JSON (no markdown, no explanation):
{"name":"...","logoUrl":"...","description":"...","mission":"...","suggestedCategory":"..."}

HTML CONTENT:
${combinedHtml}`
        }
      ]
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    try {
      // Try to extract JSON from the response - handle markdown code blocks and extra text
      let jsonStr = responseText;

      // Remove markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      } else {
        // Try to find JSON object in the response
        const objectMatch = responseText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonStr = objectMatch[0];
        }
      }

      const parsed = JSON.parse(jsonStr);

      if (parsed.error) {
        return { error: parsed.error };
      }

      return {
        name: parsed.name || undefined,
        logoUrl: parsed.logoUrl || undefined,
        description: parsed.description || undefined,
        mission: parsed.mission || undefined,
        suggestedCategory: parsed.suggestedCategory || undefined,
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Response was:", responseText.slice(0, 500));
      return { error: "Failed to extract information from website. Please fill in the form manually." };
    }
  } catch (error) {
    console.error("Nonprofit info extraction error:", error);
    return { error: error instanceof Error ? error.message : "Failed to extract nonprofit info" };
  }
}
