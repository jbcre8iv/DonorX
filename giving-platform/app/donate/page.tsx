import { createClient } from "@/lib/supabase/server";
import { DonateClient } from "./donate-client";
import type { Nonprofit, Category } from "@/types/database";

export const metadata = {
  title: "Make a Donation",
};

interface DonatePageProps {
  searchParams: Promise<{ nonprofit?: string }>;
}

export default async function DonatePage({ searchParams }: DonatePageProps) {
  const { nonprofit: preselectedNonprofitId } = await searchParams;
  const supabase = await createClient();

  // Fetch approved nonprofits
  const { data: nonprofits } = await supabase
    .from("nonprofits")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("name");

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <DonateClient
      nonprofits={(nonprofits as Nonprofit[]) || []}
      categories={(categories as Category[]) || []}
      preselectedNonprofitId={preselectedNonprofitId}
    />
  );
}
