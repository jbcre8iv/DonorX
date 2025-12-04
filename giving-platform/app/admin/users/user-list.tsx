"use client";

import { useState, useMemo } from "react";
import { Users, UserPlus, Loader2, Clock, UserMinus, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { promoteToTeam, removeFromTeam } from "./actions";
import { formatDate } from "@/lib/utils";
import { ViewProfileButton } from "./user-profile-modal";

type UserRole = "owner" | "admin" | "member" | "viewer";

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
  status: string;
  created_at: string;
  approved_at: string | null;
  organization: Organization | null;
}

interface UserListProps {
  users: User[];
  currentUserRole: string | null;
}

type SortField = "name" | "email" | "joined";
type SortDirection = "asc" | "desc";

export function UserList({ users, currentUserRole }: UserListProps) {
  const canManageUsers = currentUserRole === "owner" || currentUserRole === "admin";
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<string, "admin" | "member" | "viewer">>({});
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter to only show non-team users (those without team roles)
  const teamRoles = ["owner", "admin", "member", "viewer"];
  const regularUsers = users.filter((u) => !u.role || !teamRoles.includes(u.role));

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = regularUsers;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.first_name?.toLowerCase().includes(searchLower) ||
          user.last_name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          const nameA = `${a.first_name || ""} ${a.last_name || ""}`.trim().toLowerCase();
          const nameB = `${b.first_name || ""} ${b.last_name || ""}`.trim().toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "joined":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [regularUsers, search, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600" />
    );
  };

  async function handlePromote(userId: string) {
    const role = selectedRole[userId] || "member";
    const user = regularUsers.find(u => u.id === userId);
    const userName = user?.first_name || user?.email || "this user";

    if (!confirm(`Are you sure you want to promote ${userName} to ${role}?`)) {
      return;
    }

    setLoadingUserId(userId);
    setError(null);

    const result = await promoteToTeam(userId, role);

    if (result.error) {
      setError(result.error);
    }

    setLoadingUserId(null);
  }

  if (!canManageUsers) {
    return null;
  }

  if (regularUsers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-600" />
            Registered Users
            <Badge variant="secondary">{regularUsers.length}</Badge>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
        </div>
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

        {/* Sort controls */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <span className="text-slate-500">Sort by:</span>
          <button
            onClick={() => handleSort("name")}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
          >
            Name {renderSortIcon("name")}
          </button>
          <button
            onClick={() => handleSort("email")}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
          >
            Email {renderSortIcon("email")}
          </button>
          <button
            onClick={() => handleSort("joined")}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
          >
            Joined {renderSortIcon("joined")}
          </button>
        </div>

        {filteredAndSortedUsers.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            No users match your search
          </p>
        ) : (
        <div className="space-y-3">
          {filteredAndSortedUsers.map((user) => {
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
                  <ViewProfileButton user={user} />
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
                    {currentUserRole === "owner" && <option value="admin">Admin</option>}
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
        )}

        {filteredAndSortedUsers.length > 0 && (
          <div className="mt-4 text-sm text-slate-500">
            Showing {filteredAndSortedUsers.length} of {regularUsers.length} users
          </div>
        )}
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
