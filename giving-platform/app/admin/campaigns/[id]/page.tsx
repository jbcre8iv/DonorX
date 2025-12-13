import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CampaignForm } from "../campaign-form";
import type { Campaign } from "@/types/database";

export const metadata = {
  title: "Edit Campaign - Admin",
};

interface EditCampaignPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    adminClient = supabase;
  }

  // Fetch campaign
  const { data: campaign, error } = await adminClient
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    notFound();
  }

  // Fetch approved nonprofits for dropdown
  const { data: nonprofits } = await adminClient
    .from("nonprofits")
    .select("id, name")
    .eq("status", "approved")
    .order("name");

  const typedCampaign = campaign as Campaign;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/campaigns"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">
            Edit Campaign
          </h1>
          <p className="text-slate-600">{typedCampaign.title}</p>
        </div>
        <Button variant="outline" asChild>
          <a
            href={`/campaigns/${typedCampaign.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Campaign
          </a>
        </Button>
      </div>

      <CampaignForm campaign={typedCampaign} nonprofits={nonprofits || []} />
    </div>
  );
}
