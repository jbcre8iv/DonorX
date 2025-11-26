import { createClient } from "@/lib/supabase/server";
import { DirectoryClient } from "./directory-client";
import type { Nonprofit, Category } from "@/types/database";

export const metadata = {
  title: "Nonprofit Directory",
};

export default async function DirectoryPage() {
  const supabase = await createClient();

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  // Fetch approved nonprofits with their categories
  const { data: nonprofits } = await supabase
    .from("nonprofits")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("name");

  return (
    <DirectoryClient
      initialNonprofits={(nonprofits as Nonprofit[]) || []}
      categories={(categories as Category[]) || []}
    />
  );
}
