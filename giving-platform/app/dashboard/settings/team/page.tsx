import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TeamClient } from "./team-client";

export const metadata = {
  title: "Team Management",
};

export default async function TeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get current user's profile with organization
  const { data: profile } = await supabase
    .from("users")
    .select(`
      *,
      organization:organizations(id, name)
    `)
    .eq("id", user.id)
    .single();

  if (!profile?.organization) {
    redirect("/dashboard/settings");
  }

  // Get all team members in the organization
  const { data: members } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, avatar_url, role, created_at")
    .eq("organization_id", profile.organization.id)
    .order("created_at", { ascending: true });

  // Get pending invitations (only for admins/owners)
  let invitations: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
  }> = [];

  if (["owner", "admin"].includes(profile.role)) {
    const { data: inviteData } = await supabase
      .from("team_invitations")
      .select("id, email, role, status, created_at, expires_at")
      .eq("organization_id", profile.organization.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    invitations = inviteData || [];
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Settings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Team Management</h1>
              <p className="text-slate-600">{profile.organization.name}</p>
            </div>
          </div>
        </div>
      </div>

      <TeamClient
        members={members || []}
        invitations={invitations}
        currentUserId={user.id}
        currentUserRole={profile.role}
      />
    </div>
  );
}
