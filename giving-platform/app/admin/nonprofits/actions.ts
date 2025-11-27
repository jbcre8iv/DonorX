"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/permissions";
import Anthropic from "@anthropic-ai/sdk";

export async function approveNonprofit(nonprofitId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("nonprofits")
    .update({ status: "approved" })
    .eq("id", nonprofitId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true };
}

export async function rejectNonprofit(nonprofitId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("nonprofits")
    .update({ status: "rejected" })
    .eq("id", nonprofitId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleFeatured(nonprofitId: string, featured: boolean) {
  // Note: is_featured column doesn't exist in DB yet
  // This is a placeholder for future feature
  console.log(`toggleFeatured called for ${nonprofitId}, featured: ${featured}`);

  revalidatePath("/admin/nonprofits");
  revalidatePath("/directory");
  return { success: true };
}

export async function deleteNonprofit(nonprofitId: string) {
  // Only owners can delete nonprofits
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  const supabase = await createClient();

  // First check if there are any allocations to this nonprofit
  const { data: allocations } = await supabase
    .from("allocations")
    .select("id")
    .eq("nonprofit_id", nonprofitId)
    .limit(1);

  if (allocations && allocations.length > 0) {
    return { error: "Cannot delete nonprofit with existing donations" };
  }

  const { error } = await supabase
    .from("nonprofits")
    .delete()
    .eq("id", nonprofitId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true };
}

export async function createNonprofit(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const ein = formData.get("ein") as string;
  const description = formData.get("description") as string;
  const mission = formData.get("mission") as string;
  const website = formData.get("website") as string;
  const categoryId = formData.get("category_id") as string;
  const logoUrl = formData.get("logo_url") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  const { error } = await supabase.from("nonprofits").insert({
    name,
    ein,
    description: description || null,
    mission: mission || null,
    website: website || null,
    category_id: categoryId || null,
    logo_url: logoUrl || null,
    status: "approved", // Admin-added nonprofits are auto-approved
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true };
}

export async function updateNonprofit(nonprofitId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const ein = formData.get("ein") as string;
  const description = formData.get("description") as string;
  const mission = formData.get("mission") as string;
  const website = formData.get("website") as string;
  const categoryId = formData.get("category_id") as string;
  const logoUrl = formData.get("logo_url") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  const { error } = await supabase
    .from("nonprofits")
    .update({
      name,
      ein,
      description: description || null,
      mission: mission || null,
      website: website || null,
      category_id: categoryId || null,
      logo_url: logoUrl || null,
    })
    .eq("id", nonprofitId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/directory");
  revalidatePath(`/directory/${nonprofitId}`);
  return { success: true };
}

export interface ExtractedNonprofitInfo {
  name?: string;
  logoUrl?: string;
  description?: string;
  mission?: string;
  suggestedCategory?: string;
  error?: string;
}

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
5. **Category**: ALWAYS select the best fit from: Education, Health, Environment, Animals, Arts & Culture, Human Services, International, Religion, Sports Ministry, Community Development, Youth Development, Disaster Relief. Infer from organization name (e.g., "Ministry" suggests Religion or Sports Ministry, "Foundation" could be various, "MX" suggests motocross/sports)

CRITICAL RULES:
- NEVER return null for category - always make your best guess
- NEVER return null for mission - generate one if not found
- For faith-based sports organizations, use "Sports Ministry" category
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
      const parsed = JSON.parse(responseText);

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
    } catch {
      return { error: "Failed to parse AI response" };
    }
  } catch (error) {
    console.error("Nonprofit info extraction error:", error);
    return { error: error instanceof Error ? error.message : "Failed to extract nonprofit info" };
  }
}

export async function detectLogoUrl(websiteUrl: string): Promise<{ logoUrl?: string; error?: string }> {
  if (!websiteUrl) {
    return { error: "Website URL is required" };
  }

  try {
    // Fetch the website HTML
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DonorX/1.0)",
      },
    });

    if (!response.ok) {
      return { error: `Failed to fetch website: ${response.status}` };
    }

    const html = await response.text();

    // Truncate HTML to avoid token limits (keep first 50KB)
    const truncatedHtml = html.slice(0, 50000);

    // Use Claude to extract the logo URL
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Analyze this HTML and find the organization's logo URL. Look for:
1. Open Graph image (og:image meta tag)
2. Twitter card image
3. Favicon or apple-touch-icon
4. Logo in header/nav (img tags with "logo" in class, id, alt, or src)
5. Site icon link tags

Return ONLY the full absolute URL of the best logo image found. If the URL is relative, convert it to absolute using the base URL: ${websiteUrl}

If no suitable logo is found, respond with just "NOT_FOUND".

HTML:
${truncatedHtml}`
        }
      ]
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    if (responseText === "NOT_FOUND" || !responseText) {
      return { error: "No logo found on the website" };
    }

    // Basic URL validation
    try {
      new URL(responseText);
      return { logoUrl: responseText };
    } catch {
      return { error: "Invalid logo URL extracted" };
    }
  } catch (error) {
    console.error("Logo detection error:", error);
    return { error: error instanceof Error ? error.message : "Failed to detect logo" };
  }
}
