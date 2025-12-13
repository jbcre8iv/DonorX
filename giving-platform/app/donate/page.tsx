import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DonateClient } from "./donate-client";
import { loadTemplateById, type DonationTemplate } from "./actions";
import type { Nonprofit, Category } from "@/types/database";

export const metadata = {
  title: "Make a Donation",
};

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

interface DonatePageProps {
  searchParams: Promise<{ nonprofit?: string; template?: string; campaign?: string; fundraiser?: string }>;
}

export default async function DonatePage({ searchParams }: DonatePageProps) {
  const { nonprofit: preselectedNonprofitId, template: templateId, campaign: campaignId, fundraiser: fundraiserId } = await searchParams;
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Use admin client to bypass RLS for public nonprofit data
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (e) {
    console.error("[DonatePage] Admin client error:", e);
    adminClient = supabase;
  }

  // Fetch approved nonprofits
  const { data: nonprofits } = await adminClient
    .from("nonprofits")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("name");

  // Fetch categories
  const { data: categories } = await adminClient
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
      campaignId={campaignId}
      fundraiserId={fundraiserId}
    />
  );
}
