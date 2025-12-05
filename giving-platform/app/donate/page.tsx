import { createClient } from "@/lib/supabase/server";
import { DonateClient } from "./donate-client";
import { loadTemplateById, type DonationTemplate } from "./actions";
import type { Nonprofit, Category } from "@/types/database";

export const metadata = {
  title: "Make a Donation",
};

interface DonatePageProps {
  searchParams: Promise<{ nonprofit?: string; template?: string }>;
}

export default async function DonatePage({ searchParams }: DonatePageProps) {
  const { nonprofit: preselectedNonprofitId, template: templateId } = await searchParams;
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

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

  // Load template if template ID is provided
  let initialTemplate: DonationTemplate | undefined;
  if (templateId) {
    const result = await loadTemplateById(templateId);
    if (result.success && result.template) {
      initialTemplate = result.template;
    }
  }

  return (
    <DonateClient
      nonprofits={(nonprofits as Nonprofit[]) || []}
      categories={(categories as Category[]) || []}
      preselectedNonprofitId={preselectedNonprofitId}
      initialTemplate={initialTemplate}
      isAuthenticated={!!user}
    />
  );
}
