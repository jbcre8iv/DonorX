import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Users, Shield, UserCheck, Clock, UserPlus, AlertCircle } from "lucide-react";
import { RoleSelector } from "./role-selector";
import { CopyLinkButton } from "./copy-link-button";
import { UserApprovalButtons } from "./user-approval-buttons";

export const metadata = {
  title: "Team - Admin",
};

type UserRole = "owner" | "admin" | "member" | "viewer";
type UserStatus = "pending" | "approved" | "rejected";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole | null;
  status: UserStatus;
  created_at: string;
}

const roleColors: Record<UserRole, "default" | "secondary" | "success" | "warning"> = {
  owner: "warning",
  admin: "success",
  member: "default",
  viewer: "secondary",
};

const roleIcons: Record<UserRole, typeof Shield> = {
  owner: Shield,
  admin: Shield,
  member: UserCheck,
  viewer: Users,
};

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
      .select("id, email, first_name, last_name, role, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminUsersPage] Error fetching users:", error.message);
    } else {
      users = data || [];
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
      .select("id, email, first_name, last_name, role, status, created_at")
      .order("created_at", { ascending: false });
    users = data || [];
  }

  const stats = {
    total: users.length,
    pending: users.filter((u) => u.status === "pending").length,
    owners: users.filter((u) => u.role === "owner").length,
    admins: users.filter((u) => u.role === "admin").length,
    members: users.filter((u) => u.role === "member" || !u.role).length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Team</h1>
        <p className="text-slate-600">Manage platform team members and roles</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.pending > 0 ? "border-amber-300 bg-amber-50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${stats.pending > 0 ? "text-amber-700" : "text-slate-600"}`}>Pending</p>
                <p className={`mt-1 text-2xl font-semibold ${stats.pending > 0 ? "text-amber-900" : "text-slate-900"}`}>{stats.pending}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stats.pending > 0 ? "bg-amber-200" : "bg-amber-100"}`}>
                <AlertCircle className={`h-5 w-5 ${stats.pending > 0 ? "text-amber-700" : "text-amber-600"}`} />
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
      </div>

      {/* Add Team Member Card for Owners */}
      {currentUserRole === "owner" && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-900">
              <UserPlus className="h-5 w-5" />
              Add Team Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-emerald-800">
              Invite team members to help manage the platform. Follow these steps:
            </p>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-semibold text-emerald-800">1</span>
                <div>
                  <span className="font-medium text-slate-900">Share the registration link</span>
                  <p className="text-slate-600">Send this link to your team member:</p>
                  <CopyLinkButton />
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-semibold text-emerald-800">2</span>
                <div>
                  <span className="font-medium text-slate-900">They create an account</span>
                  <p className="text-slate-600">They&apos;ll sign up with their email and password (they&apos;ll see a pending approval page)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-semibold text-emerald-800">3</span>
                <div>
                  <span className="font-medium text-slate-900">Approve their account</span>
                  <p className="text-slate-600">Find them in the list below (status: pending) and click &quot;Approve&quot;</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-semibold text-emerald-800">4</span>
                <div>
                  <span className="font-medium text-slate-900">Promote them to Admin (optional)</span>
                  <p className="text-slate-600">Once approved, click &quot;Change&quot; to set their role to Admin</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Team Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No team members found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">User</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">Email</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">Status</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">Role</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-600">Joined</th>
                    {currentUserRole === "owner" && (
                      <th className="pb-3 text-right text-sm font-medium text-slate-600">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const role = user.role || "member";
                    const RoleIcon = roleIcons[role] || Users;
                    const fullName = user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.first_name || "—";
                    const initials = user.first_name
                      ? `${user.first_name.charAt(0)}${user.last_name?.charAt(0) || ""}`
                      : user.email.charAt(0).toUpperCase();
                    const isCurrentUser = currentAuthUser?.id === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                              {initials.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-slate-900">{fullName}</span>
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-slate-500">(you)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-600">{user.email}</td>
                        <td className="py-4">
                          <Badge
                            variant={
                              user.status === "approved"
                                ? "success"
                                : user.status === "pending"
                                ? "warning"
                                : "destructive"
                            }
                            className="capitalize"
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <Badge variant={roleColors[role]} className="capitalize">
                            <RoleIcon className="mr-1 h-3 w-3" />
                            {role}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                        {currentUserRole === "owner" && (
                          <td className="py-4 text-right">
                            {user.status === "approved" ? (
                              <RoleSelector
                                userId={user.id}
                                currentRole={role}
                                isCurrentUser={isCurrentUser}
                                currentUserRole={currentUserRole}
                              />
                            ) : (
                              <UserApprovalButtons
                                userId={user.id}
                                userStatus={user.status}
                              />
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
