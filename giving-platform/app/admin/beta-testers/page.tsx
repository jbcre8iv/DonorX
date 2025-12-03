import { createAdminClient } from "@/lib/supabase/server";
import { BetaTestersClient } from "./beta-testers-client";

export const metadata = {
  title: "Beta Testers | Admin",
};

export default async function BetaTestersPage() {
  const adminClient = createAdminClient();

  const { data: testers, error } = await adminClient
    .from("beta_testers")
    .select(`
      id,
      email,
      name,
      notes,
      is_active,
      created_at,
      added_by_user:users!beta_testers_added_by_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching beta testers:", error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-purple-900">Beta Testers</h1>
        <p className="text-purple-700/70">
          Manage email-based access to the platform during beta
        </p>
      </div>

      <BetaTestersClient initialTesters={testers || []} />
    </div>
  );
}
