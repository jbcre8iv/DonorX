import { redirect } from "next/navigation";
import { Users, UserPlus, Mail, Clock } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { InviteTeamMemberForm } from "./invite-form";
import { RemoveTeamMemberButton } from "./remove-member-button";
import type { Nonprofit, NonprofitUser, NonprofitInvitation } from "@/types/database";

export const metadata = {
  title: "Team Management - Nonprofit Portal",
};

export default async function NonprofitTeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get nonprofit from user's nonprofit_users record
  const adminClient = createAdminClient();
  const { data: currentUserMembership } = await adminClient
    .from("nonprofit_users")
    .select(`
      role,
      nonprofit:nonprofits(*)
    `)
    .eq("user_id", user.id)
    .single();

  if (!currentUserMembership) {
    redirect("/nonprofit");
  }

  // Only admins can access team page
  if (currentUserMembership.role !== "admin") {
    redirect("/nonprofit");
  }

  const nonprofit = currentUserMembership.nonprofit as unknown as Nonprofit;

  // Get all team members
  const { data: teamMembers } = await supabase
    .from("nonprofit_users")
    .select(`
      *,
      user:users(email, full_name)
    `)
    .eq("nonprofit_id", nonprofit.id)
    .order("created_at", { ascending: true });

  // Get pending invitations
  const { data: pendingInvitations } = await supabase
    .from("nonprofit_invitations")
    .select("*")
    .eq("nonprofit_id", nonprofit.id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const members = (teamMembers || []) as (NonprofitUser & {
    user: { email: string; full_name: string | null };
  })[];
  const invitations = (pendingInvitations || []) as NonprofitInvitation[];

  const roleColors: Record<string, "default" | "success" | "secondary"> = {
    admin: "success",
    editor: "default",
    viewer: "secondary",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Team Management</h1>
        <p className="text-slate-600">
          Manage who has access to your nonprofit portal.
        </p>
      </div>

      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </CardTitle>
          <CardDescription>
            Send an invitation to join your organization&apos;s portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteTeamMemberForm nonprofitId={nonprofit.id} />
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{invitation.email}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <Badge variant={roleColors[invitation.role]}>
                        {invitation.role}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires {formatDate(invitation.expires_at)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {member.user.full_name || member.user.email}
                    {member.user_id === user.id && (
                      <span className="ml-2 text-sm text-slate-500">(you)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span>{member.user.email}</span>
                    <span>Joined {formatDate(member.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={roleColors[member.role]}>
                    {member.role}
                  </Badge>
                  {member.user_id !== user.id && (
                    <RemoveTeamMemberButton
                      memberId={member.id}
                      memberName={member.user.full_name || member.user.email}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Explanations */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <h3 className="font-medium text-slate-900 mb-3">Role Permissions</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-green-700">Admin:</span>{" "}
                <span className="text-slate-600">
                  Full access. Can edit profile, manage team, and delete content.
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Editor:</span>{" "}
                <span className="text-slate-600">
                  Can edit profile, create/edit impact reports, and update goals.
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Viewer:</span>{" "}
                <span className="text-slate-600">
                  Read-only access. Can view analytics and reports.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
