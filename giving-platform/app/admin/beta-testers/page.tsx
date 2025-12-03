import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { BetaTestersClient } from "./beta-testers-client";

export const metadata = {
  title: "Beta Testers | Admin",
};

export default async function BetaTestersPage() {
  // Check if user is an owner
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "owner") {
    redirect("/admin");
  }

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

  // Transform the data to flatten the added_by_user array to single object
  const transformedTesters = (testers || []).map(tester => ({
    ...tester,
    added_by_user: Array.isArray(tester.added_by_user)
      ? tester.added_by_user[0] || null
      : tester.added_by_user
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-purple-900">Beta Testers</h1>
        <p className="text-purple-700/70">
          Manage email-based access to the platform during beta
        </p>
      </div>

      <BetaTestersClient initialTesters={transformedTesters} />
    </div>
  );
}
