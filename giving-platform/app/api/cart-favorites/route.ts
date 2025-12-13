import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET - Fetch user's cart and favorites
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Fetch cart, favorites, and draft in parallel
    const [cartResult, favoritesResult, draftResult] = await Promise.all([
      adminClient
        .from("cart_items")
        .select(`
          id,
          nonprofit_id,
          category_id,
          percentage,
          created_at,
          nonprofits:nonprofit_id (id, name, logo_url, mission),
          categories:category_id (id, name, icon)
        `)
        .eq("user_id", user.id),
      adminClient
        .from("user_favorites")
        .select(`
          id,
          nonprofit_id,
          category_id,
          created_at,
          nonprofits:nonprofit_id (id, name, logo_url, mission, website),
          categories:category_id (id, name, icon)
        `)
        .eq("user_id", user.id),
      adminClient
        .from("donation_drafts")
        .select("*")
        .eq("user_id", user.id)
        .single(),
    ]);

    // Transform cart items
    const cart = (cartResult.data || []).map((item: any) => ({
      id: item.id,
      nonprofitId: item.nonprofit_id,
      categoryId: item.category_id,
      percentage: parseFloat(item.percentage) || 0,
      createdAt: item.created_at,
      nonprofit: item.nonprofits
        ? {
            id: item.nonprofits.id,
            name: item.nonprofits.name,
            logoUrl: item.nonprofits.logo_url,
            mission: item.nonprofits.mission,
          }
        : undefined,
      category: item.categories
        ? {
            id: item.categories.id,
            name: item.categories.name,
            icon: item.categories.icon,
          }
        : undefined,
    }));

    // Transform favorites
    const favorites = (favoritesResult.data || []).map((item: any) => ({
      id: item.id,
      nonprofitId: item.nonprofit_id,
      categoryId: item.category_id,
      createdAt: item.created_at,
      nonprofit: item.nonprofits
        ? {
            id: item.nonprofits.id,
            name: item.nonprofits.name,
            logoUrl: item.nonprofits.logo_url,
            mission: item.nonprofits.mission,
            website: item.nonprofits.website,
          }
        : undefined,
      category: item.categories
        ? {
            id: item.categories.id,
            name: item.categories.name,
            icon: item.categories.icon,
          }
        : undefined,
    }));

    // Transform draft
    const dbDraft = draftResult.data;
    const draft = dbDraft
      ? {
          id: dbDraft.id,
          amountCents: dbDraft.amount_cents,
          frequency: dbDraft.frequency,
          allocations:
            typeof dbDraft.allocations === "string"
              ? JSON.parse(dbDraft.allocations)
              : dbDraft.allocations,
          lockedIds: dbDraft.locked_ids
            ? typeof dbDraft.locked_ids === "string"
              ? JSON.parse(dbDraft.locked_ids)
              : dbDraft.locked_ids
            : undefined,
          updatedAt: dbDraft.updated_at,
        }
      : null;

    return NextResponse.json({ cart, favorites, draft });
  } catch (error) {
    console.error("Error fetching cart/favorites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
