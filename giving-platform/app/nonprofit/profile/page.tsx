import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import type { Nonprofit } from "@/types/database";

export const metadata = {
  title: "Edit Profile - Nonprofit Portal",
};

export default async function NonprofitProfilePage() {
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
        <h1 className="text-2xl font-semibold text-slate-900">Organization Profile</h1>
        <p className="text-slate-600">
          {canEdit
            ? "Update your organization's public profile and contact information."
            : "View your organization's profile. Contact an admin to make changes."}
        </p>
      </div>

      <ProfileForm nonprofit={nonprofit} canEdit={canEdit} />
    </div>
  );
}
