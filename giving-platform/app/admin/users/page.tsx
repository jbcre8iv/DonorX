import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, UserCheck, UserPlus } from "lucide-react";
import { UserList } from "./user-list";
import { TeamMembersTable } from "./team-members-table";

export const metadata = {
  title: "Users - Admin",
};

type UserRole = "owner" | "admin" | "member" | "viewer";
type UserStatus = "pending" | "approved" | "rejected";

interface Organization {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
  website: string | null;
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: UserRole | null;
  status: UserStatus;
  created_at: string;
  approved_at: string | null;
  organization: Organization | null;
  simulation_access: boolean | null;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user: currentAuthUser },
  } = await supabase.auth.getUser();

  let users: User[] = [];
  let currentUserRole: UserRole = "member";

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("users")
      .select(`
        id, email, first_name, last_name, avatar_url, role, status, created_at, approved_at, simulation_access,
        organization:organizations(id, name, type, logo_url, website)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminUsersPage] Error fetching users:", error.message);
    } else {
      // Transform data to handle organization being returned as array from Supabase join
      users = (data || []).map((u) => ({
        ...u,
        organization: Array.isArray(u.organization) ? u.organization[0] || null : u.organization,
      })) as User[];
    }

    // Get current user's role
    if (currentAuthUser) {
      const currentUser = users.find((u) => u.id === currentAuthUser.id);
      currentUserRole = currentUser?.role || "member";
    }
  } catch (e) {
    console.error("[AdminUsersPage] Admin client error:", e);
    // Fallback to regular client
    const { data } = await supabase
      .from("users")
      .select(`
        id, email, first_name, last_name, avatar_url, role, status, created_at, approved_at, simulation_access,
        organization:organizations(id, name, type, logo_url, website)
      `)
      .order("created_at", { ascending: false });
    users = (data || []).map((u) => ({
      ...u,
      organization: Array.isArray(u.organization) ? u.organization[0] || null : u.organization,
    })) as User[];
  }

  // Filter to only team members (those with explicit team roles)
  const teamRoles = ["owner", "admin", "member", "viewer"];
  const teamMembers = users.filter((u) => u.role && teamRoles.includes(u.role));
  const registeredUsers = users.filter((u) => !u.role || !teamRoles.includes(u.role));

  const stats = {
    total: teamMembers.length,
    pending: teamMembers.filter((u) => u.status === "pending").length,
    owners: teamMembers.filter((u) => u.role === "owner").length,
    admins: teamMembers.filter((u) => u.role === "admin").length,
    members: teamMembers.filter((u) => u.role === "member" || u.role === "viewer").length,
    registered: registeredUsers.length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-purple-900">Users</h1>
        <p className="text-purple-700/70">Manage platform users and team members</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Team</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Owners</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.owners}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Shield className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Admins</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.admins}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Shield className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Members</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.members}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <UserCheck className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Registered</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.registered}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <UserPlus className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Table */}
      <TeamMembersTable
        teamMembers={teamMembers}
        currentUserId={currentAuthUser?.id || null}
        currentUserRole={currentUserRole}
      />

      {/* Registered Users - Owners and admins can promote to team */}
      <UserList users={users} currentUserRole={currentUserRole} />
    </div>
  );
}
