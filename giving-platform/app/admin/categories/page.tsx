import { createClient } from "@/lib/supabase/server";
import { CategoriesClient } from "./categories-client";

export const metadata = {
  title: "Manage Categories",
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  // Fetch all categories
  const { data: categoryData } = await supabase
    .from("categories")
    .select("id, name, description, icon")
    .order("name");

  // Count nonprofits per category
  const { data: nonprofitCounts } = await supabase
    .from("nonprofits")
    .select("category_id")
    .not("category_id", "is", null);

  // Calculate counts
  const countsMap: Record<string, number> = {};
  (nonprofitCounts || []).forEach((np: { category_id: string | null }) => {
    if (np.category_id) {
      countsMap[np.category_id] = (countsMap[np.category_id] || 0) + 1;
    }
  });

  const categories = (categoryData || []).map((c) => ({
    ...c,
    nonprofit_count: countsMap[c.id] || 0,
  }));

  return <CategoriesClient categories={categories} />;
}
