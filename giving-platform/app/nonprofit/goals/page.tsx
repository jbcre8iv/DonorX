import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoalsForm } from "./goals-form";
import type { Nonprofit } from "@/types/database";

export const metadata = {
  title: "Fundraising Goals - Nonprofit Portal",
};

export default async function NonprofitGoalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get nonprofit from user's nonprofit_users record
  const { data: nonprofitUser } = await supabase
    .from("nonprofit_users")
    .select(`
      role,
      nonprofit:nonprofits(*)
    `)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser) {
    redirect("/nonprofit");
  }

  const nonprofit = nonprofitUser.nonprofit as unknown as Nonprofit;
  const canEdit = ["admin", "editor"].includes(nonprofitUser.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Fundraising Goals</h1>
        <p className="text-slate-600">
          Set and track your fundraising targets. Goals are displayed on your public profile page.
        </p>
      </div>

      <GoalsForm nonprofit={nonprofit} canEdit={canEdit} />
    </div>
  );
}
