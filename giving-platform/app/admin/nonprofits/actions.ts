"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/permissions";
import Anthropic from "@anthropic-ai/sdk";

export async function approveNonprofit(nonprofitId: string) {
  // Use admin client to bypass RLS for admin operations
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("nonprofits")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", nonprofitId);

  if (error) {
    console.error("Approve nonprofit error:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true };
}

export async function rejectNonprofit(nonprofitId: string) {
  // Use admin client to bypass RLS for admin operations
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("nonprofits")
    .update({ status: "rejected" })
    .eq("id", nonprofitId);

  if (error) {
    console.error("Reject nonprofit error:", error);
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

  // Use admin client to bypass RLS for admin operations
  const adminSupabase = createAdminClient();

  // Check for allocations to this nonprofit and whether they're from simulated donations
  const { data: allocations } = await adminSupabase
    .from("allocations")
    .select(`
      id,
      donation_id,
      donation:donations(id, is_simulated)
    `)
    .eq("nonprofit_id", nonprofitId);

  if (allocations && allocations.length > 0) {
    // Check if any allocations are from real (non-simulated) donations
    const hasRealDonations = allocations.some((alloc) => {
      const donation = alloc.donation as { id: string; is_simulated: boolean } | null;
      return donation && !donation.is_simulated;
    });

    if (hasRealDonations) {
      return { error: "Cannot delete nonprofit with real donations. Only nonprofits with simulated donations can be deleted." };
    }

    // All donations are simulated - delete them
    // First, get unique donation IDs
    const simulatedDonationIds = [...new Set(
      allocations
        .filter((alloc) => {
          const donation = alloc.donation as { id: string; is_simulated: boolean } | null;
          return donation?.is_simulated;
        })
        .map((alloc) => alloc.donation_id)
    )];

    if (simulatedDonationIds.length > 0) {
      // Delete allocations for these donations first (due to foreign key)
      const { error: allocDeleteError } = await adminSupabase
        .from("allocations")
        .delete()
        .in("donation_id", simulatedDonationIds);

      if (allocDeleteError) {
        console.error("Delete allocations error:", allocDeleteError);
        return { error: `Failed to delete simulated allocations: ${allocDeleteError.message}` };
      }

      // Delete the simulated donations
      const { error: donationDeleteError } = await adminSupabase
        .from("donations")
        .delete()
        .in("id", simulatedDonationIds);

      if (donationDeleteError) {
        console.error("Delete donations error:", donationDeleteError);
        return { error: `Failed to delete simulated donations: ${donationDeleteError.message}` };
      }
    }
  }

  // Now delete the nonprofit
  const { error } = await adminSupabase
    .from("nonprofits")
    .delete()
    .eq("id", nonprofitId);

  if (error) {
    console.error("Delete nonprofit error:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  revalidatePath("/directory");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/receipts");
  return { success: true };
}

export async function createNonprofit(formData: FormData) {
  // Use admin client to bypass RLS for admin operations
  const adminSupabase = createAdminClient();

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

  const { error } = await adminSupabase.from("nonprofits").insert({
    name,
    ein,
    description: description || null,
    mission: mission || null,
    website: website || null,
    category_id: categoryId || null,
    logo_url: logoUrl || null,
    status: "approved", // Admin-added nonprofits are auto-approved
    approved_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Create nonprofit error:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true };
}

export async function updateNonprofit(nonprofitId: string, formData: FormData) {
  // Use admin client to bypass RLS for admin operations
  const adminSupabase = createAdminClient();

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

  const { error } = await adminSupabase
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
    console.error("Update nonprofit error:", error);
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
