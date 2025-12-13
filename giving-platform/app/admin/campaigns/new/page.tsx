import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CampaignForm } from "../campaign-form";

export const metadata = {
  title: "Create Campaign - Admin",
};

export default async function NewCampaignPage() {
  const supabase = await createClient();

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    adminClient = supabase;
  }

  // Fetch approved nonprofits for dropdown
  const { data: nonprofits } = await adminClient
    .from("nonprofits")
    .select("id, name")
    .eq("status", "approved")
    .order("name");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Create Campaign</h1>
        <p className="text-slate-600">
          Set up a new time-limited fundraising campaign
        </p>
      </div>

      <CampaignForm nonprofits={nonprofits || []} />
    </div>
  );
}
