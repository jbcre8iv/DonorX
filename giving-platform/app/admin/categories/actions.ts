"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/permissions";
import Anthropic from "@anthropic-ai/sdk";

export interface GeneratedCategoryInfo {
  name?: string;
  description?: string;
  icon?: string;
  error?: string;
}

export async function generateCategoryInfo(input: string): Promise<GeneratedCategoryInfo> {
  if (!input || input.trim().length < 2) {
    return { error: "Please enter a category name or description" };
  }

  try {
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are helping create a nonprofit category for a giving platform. Based on the admin's input, generate a polished category entry.

Admin input: "${input}"

Generate:
1. **Name**: A clear, concise category name (2-4 words, title case). Examples: "Animal Welfare", "Youth Development", "Disaster Relief", "Arts & Culture"
2. **Description**: A brief description (10-20 words) explaining what types of nonprofits belong in this category
3. **Icon**: Suggest a single emoji that represents this category well

Respond ONLY with valid JSON (no markdown, no explanation):
{"name":"...","description":"...","icon":"..."}

Examples:
- Input: "religious" → {"name":"Religious","description":"Churches, missions, and faith-based charitable organizations","icon":"⛪"}
- Input: "sports ministry" → {"name":"Sports Ministry","description":"Faith-based organizations using athletics to serve communities and share their mission","icon":"⚽"}
- Input: "animals" → {"name":"Animal Welfare","description":"Animal rescue, shelters, and wildlife protection organizations","icon":"🐾"}`
        }
      ]
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    try {
      const parsed = JSON.parse(responseText);
      return {
        name: parsed.name || undefined,
        description: parsed.description || undefined,
        icon: parsed.icon || undefined,
      };
    } catch {
      return { error: "Failed to parse AI response" };
    }
  } catch (error) {
    console.error("Category generation error:", error);
    return { error: error instanceof Error ? error.message : "Failed to generate category info" };
  }
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  const { error } = await supabase.from("categories").insert({
    name,
    description: description || null,
    icon: icon || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/directory");
  revalidatePath("/donate");
  return { success: true };
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      description: description || null,
      icon: icon || null,
    })
    .eq("id", categoryId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/directory");
  revalidatePath("/donate");
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  // Only owners can delete categories
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  const supabase = await createClient();

  // Check if there are any nonprofits in this category
  const { data: nonprofits } = await supabase
    .from("nonprofits")
    .select("id")
    .eq("category_id", categoryId)
    .limit(1);

  if (nonprofits && nonprofits.length > 0) {
    return { error: "Cannot delete category with existing nonprofits" };
  }

  // Check if there are any allocations to this category
  const { data: allocations } = await supabase
    .from("allocations")
    .select("id")
    .eq("category_id", categoryId)
    .limit(1);

  if (allocations && allocations.length > 0) {
    return { error: "Cannot delete category with existing donations" };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/directory");
  return { success: true };
}
