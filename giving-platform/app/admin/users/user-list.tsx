"use client";

import { useState } from "react";
import { Users, UserPlus, Shield, Loader2, Clock, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { promoteToTeam, removeFromTeam } from "./actions";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  status: string;
  created_at: string;
}

interface UserListProps {
  users: User[];
  isOwner: boolean;
}

export function UserList({ users, isOwner }: UserListProps) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<string, "admin" | "member" | "viewer">>({});
  const [error, setError] = useState<string | null>(null);

  // Filter to only show non-team users (those without team roles)
  const teamRoles = ["owner", "admin", "member", "viewer"];
  const regularUsers = users.filter((u) => !u.role || !teamRoles.includes(u.role));

  async function handlePromote(userId: string) {
    const role = selectedRole[userId] || "member";
    setLoadingUserId(userId);
    setError(null);

    const result = await promoteToTeam(userId, role);

    if (result.error) {
      setError(result.error);
    }

    setLoadingUserId(null);
  }

  if (!isOwner) {
    return null;
  }

  if (regularUsers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-blue-600" />
          Registered Users
          <Badge variant="secondary">{regularUsers.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 mb-4">
          These users have registered accounts but are not team members. You can promote them to team roles.
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {regularUsers.map((user) => {
            const fullName =
              user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || "—";
            const initials = user.first_name
              ? `${user.first_name.charAt(0)}${user.last_name?.charAt(0) || ""}`
              : user.email.charAt(0).toUpperCase();
            const isLoading = loadingUserId === user.id;

            return (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-sm font-medium flex-shrink-0">
                    {initials.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{fullName}</div>
                    <div className="text-sm text-slate-500 truncate">{user.email}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Joined {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={selectedRole[user.id] || "member"}
                    onChange={(e) =>
                      setSelectedRole({
                        ...selectedRole,
                        [user.id]: e.target.value as "admin" | "member" | "viewer",
                      })
                    }
                    className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white"
                    disabled={isLoading}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  <Button
                    size="sm"
                    onClick={() => handlePromote(user.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Promote
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface TeamMemberActionsProps {
  userId: string;
  isCurrentUser: boolean;
  currentRole: string;
}

export function RemoveFromTeamButton({ userId, isCurrentUser, currentRole }: TeamMemberActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Can't remove owners or yourself
  if (isCurrentUser || currentRole === "owner") {
    return null;
  }

  async function handleRemove() {
    if (!confirm("Are you sure you want to remove this user from the team?")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await removeFromTeam(userId);

    if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
  }

  return (
    <div className="relative inline-flex">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        disabled={isLoading}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <UserMinus className="h-3.5 w-3.5 mr-1" />
            Remove
          </>
        )}
      </Button>
      {error && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 z-10">
          {error}
        </div>
      )}
    </div>
  );
}
