import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NonprofitsClient } from "./nonprofits-client";

export const metadata = {
  title: "Manage Nonprofits",
};

export default async function AdminNonprofitsPage() {
  const supabase = await createClient();

  // Use admin client to bypass RLS for admin operations
  let adminClient;
  try {
    adminClient = createAdminClient();
    console.log("[AdminNonprofits] Using admin client");
  } catch (e) {
    console.error("[AdminNonprofits] Admin client failed:", e);
    // Fallback to regular client if admin not available
    adminClient = supabase;
  }

  // Fetch all nonprofits with category info
  const { data: nonprofitData, error: nonprofitError } = await adminClient
    .from("nonprofits")
    .select(`
      id,
      name,
      ein,
      description,
      mission,
      website,
      logo_url,
      status,
      category_id,
      category:categories(id, name)
    `)
    .order("created_at", { ascending: false });

  console.log("[AdminNonprofits] Query result:", { count: nonprofitData?.length, error: nonprofitError?.message });

  // Fetch all categories
  const { data: categories } = await adminClient
    .from("categories")
    .select("id, name")
    .order("name");

  // Fetch total received per nonprofit from allocations
  const { data: allocationData } = await adminClient
    .from("allocations")
    .select(`
      nonprofit_id,
      amount_cents,
      donation:donations!inner(status)
    `)
    .eq("donation.status", "completed");

  // Calculate totals per nonprofit
  const totalsMap: Record<string, number> = {};
  (allocationData || []).forEach((a: { nonprofit_id: string | null; amount_cents: number }) => {
    if (a.nonprofit_id) {
      totalsMap[a.nonprofit_id] = (totalsMap[a.nonprofit_id] || 0) + a.amount_cents;
    }
  });

  // Map nonprofits with category (handle Supabase array return) and totals
  const nonprofits = (nonprofitData || []).map((np: Record<string, unknown>) => ({
    id: np.id as string,
    name: np.name as string,
    ein: np.ein as string | null,
    description: np.description as string | null,
    mission: np.mission as string | null,
    website: np.website as string | null,
    logo_url: np.logo_url as string | null,
    status: np.status as string,
    is_featured: false, // Column doesn't exist in DB yet
    category_id: np.category_id as string | null,
    category: Array.isArray(np.category) ? np.category[0] : np.category,
    total_received: totalsMap[np.id as string] || 0,
  }));

  return (
    <NonprofitsClient
      nonprofits={nonprofits}
      categories={categories || []}
    />
  );
}
