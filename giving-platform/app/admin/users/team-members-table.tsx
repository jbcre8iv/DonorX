"use client";

import { useState, useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, cn } from "@/lib/utils";
import { Users, Shield, UserCheck, Clock, Search, ArrowUpDown, ArrowUp, ArrowDown, TestTube, Loader2 } from "lucide-react";
import { RoleSelector } from "./role-selector";
import { RemoveFromTeamButton } from "./user-list";
import { ViewProfileButton } from "./user-profile-modal";
import { toggleSimulationAccess } from "./actions";

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
  simulation_access: boolean | null;
}

interface TeamMembersTableProps {
  teamMembers: User[];
  currentUserId: string | null;
  currentUserRole: UserRole | null;
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

type SortField = "name" | "email" | "role" | "joined";
type SortDirection = "asc" | "desc";

// Simulation access toggle component - allows owner to grant/revoke simulation access
function SimulationAccessToggle({
  userId,
  hasAccess,
  role,
}: {
  userId: string;
  hasAccess: boolean;
  role: UserRole;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(hasAccess);
  const [error, setError] = useState<string | null>(null);

  // Admins and owners automatically have access
  const isAutoEnabled = role === "admin" || role === "owner";

  const handleToggle = () => {
    if (isAutoEnabled) return;
    setError(null);

    startTransition(async () => {
      const result = await toggleSimulationAccess(userId, !isEnabled);
      if (result.success) {
        setIsEnabled(result.enabled ?? !isEnabled);
      } else if (result.error) {
        setError(result.error);
        console.error("[SimulationAccessToggle] Error:", result.error);
      }
    });
  };

  // For members/viewers, show a proper toggle switch
  if (!isAutoEnabled) {
    return (
      <div className="flex flex-col items-center">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            "relative w-10 h-5 rounded-full transition-colors cursor-pointer",
            isPending && "opacity-50",
            isEnabled ? "bg-amber-500" : "bg-slate-300 hover:bg-slate-400"
          )}
          title={isEnabled ? "Click to revoke simulation access" : "Click to grant simulation access"}
        >
          <div className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform flex items-center justify-center",
            isEnabled ? "translate-x-5" : "translate-x-0.5"
          )}>
            {isPending && <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-400" />}
          </div>
        </button>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    );
  }

  // For admins/owners, show "Auto" badge
  return (
    <span
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-amber-100 text-amber-700"
      title={`${role === "owner" ? "Owners" : "Admins"} automatically have simulation access`}
    >
      <TestTube className="h-3 w-3" />
      Auto
    </span>
  );
}

export function TeamMembersTable({ teamMembers, currentUserId, currentUserRole }: TeamMembersTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = teamMembers;

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

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
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
        case "role":
          const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
          comparison = (roleOrder[a.role || "viewer"] || 4) - (roleOrder[b.role || "viewer"] || 4);
          break;
        case "joined":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [teamMembers, search, roleFilter, sortField, sortDirection]);

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
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Team Members</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
              className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAndSortedMembers.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            {teamMembers.length === 0
              ? "No team members found"
              : "No members match your search"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th
                    className="pb-3 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      User
                      {renderSortIcon("name")}
                    </div>
                  </th>
                  <th
                    className="pb-3 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {renderSortIcon("email")}
                    </div>
                  </th>
                  <th
                    className="pb-3 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center gap-1">
                      Role
                      {renderSortIcon("role")}
                    </div>
                  </th>
                  <th
                    className="pb-3 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("joined")}
                  >
                    <div className="flex items-center gap-1">
                      Joined
                      {renderSortIcon("joined")}
                    </div>
                  </th>
                  {currentUserRole === "owner" && (
                    <th className="pb-3 text-center text-sm font-medium text-slate-600">
                      <div className="flex items-center justify-center gap-1" title="Simulation mode access">
                        <TestTube className="h-3.5 w-3.5" />
                        Sim
                      </div>
                    </th>
                  )}
                  <th className="pb-3 text-right text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedMembers.map((user) => {
                  const role = user.role || "member";
                  const RoleIcon = roleIcons[role] || Users;
                  const fullName =
                    user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.first_name || "—";
                  const initials = user.first_name
                    ? `${user.first_name.charAt(0)}${user.last_name?.charAt(0) || ""}`
                    : user.email.charAt(0).toUpperCase();
                  const isCurrentUser = currentUserId === user.id;

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
                        <td className="py-4 text-center">
                          <SimulationAccessToggle
                            userId={user.id}
                            hasAccess={user.simulation_access ?? false}
                            role={role}
                          />
                        </td>
                      )}
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ViewProfileButton user={user} />
                          {currentUserRole === "owner" && (
                            <>
                              <RoleSelector
                                userId={user.id}
                                currentRole={role}
                                isCurrentUser={isCurrentUser}
                                currentUserRole={currentUserRole}
                              />
                              <RemoveFromTeamButton
                                userId={user.id}
                                isCurrentUser={isCurrentUser}
                                currentRole={role}
                              />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredAndSortedMembers.length > 0 && (
          <div className="mt-4 text-sm text-slate-500">
            Showing {filteredAndSortedMembers.length} of {teamMembers.length} members
          </div>
        )}
      </CardContent>
    </Card>
  );
}
