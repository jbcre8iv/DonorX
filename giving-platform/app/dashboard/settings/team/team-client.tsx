"use client";

import { useState } from "react";
import { UserPlus, MoreVertical, Mail, Clock, Shield, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { inviteTeamMember, cancelInvitation, updateMemberRole, removeMember } from "./actions";

interface TeamMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface TeamClientProps {
  members: TeamMember[];
  invitations: Invitation[];
  currentUserId: string;
  currentUserRole: string;
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const roleColors: Record<string, "default" | "secondary" | "success" | "destructive"> = {
  owner: "default",
  admin: "success",
  member: "secondary",
  viewer: "secondary",
};

export function TeamClient({ members, invitations, currentUserId, currentUserRole }: TeamClientProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const canManageTeam = ["owner", "admin"].includes(currentUserRole);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("email", inviteEmail);
    formData.append("role", inviteRole);

    const result = await inviteTeamMember(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Invitation sent successfully!");
      setInviteEmail("");
      setInviteRole("member");
      setShowInviteForm(false);
    }
    setIsInviting(false);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    const result = await cancelInvitation(invitationId);
    if (result.error) {
      setError(result.error);
    }
    setActionLoading(null);
    setOpenDropdown(null);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setActionLoading(memberId);
    const result = await updateMemberRole(memberId, newRole);
    if (result.error) {
      setError(result.error);
    }
    setActionLoading(null);
    setOpenDropdown(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return;
    }
    setActionLoading(memberId);
    const result = await removeMember(memberId);
    if (result.error) {
      setError(result.error);
    }
    setActionLoading(null);
    setOpenDropdown(null);
  };

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-700">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Invite Form */}
      {canManageTeam && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Invite Team Members</h3>
              <p className="text-sm text-slate-500">Add new members to your organization</p>
            </div>
            {!showInviteForm && (
              <Button onClick={() => setShowInviteForm(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite
              </Button>
            )}
          </div>

          {showInviteForm && (
            <form onSubmit={handleInvite} className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="sm:w-40">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {currentUserRole === "owner" && <option value="admin">Admin</option>}
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail("");
                    setInviteRole("member");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Pending Invitations</h3>
            <p className="text-sm text-slate-500">{pendingInvitations.length} pending</p>
          </div>
          <div className="divide-y divide-slate-200">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{invitation.email}</p>
                    <p className="text-sm text-slate-500">
                      Invited as {roleLabels[invitation.role]} • Expires{" "}
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {canManageTeam && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                    disabled={actionLoading === invitation.id}
                  >
                    {actionLoading === invitation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Cancel"
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Team Members</h3>
          <p className="text-sm text-slate-500">{members.length} members</p>
        </div>
        <div className="divide-y divide-slate-200">
          {members.map((member) => {
            const isCurrentUser = member.id === currentUserId;
            const canEditMember =
              canManageTeam &&
              !isCurrentUser &&
              (currentUserRole === "owner" || member.role !== "owner");

            return (
              <div
                key={member.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                      {getInitials(member.first_name, member.last_name, member.email)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.email}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs text-slate-500">(you)</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={roleColors[member.role]}>
                    {member.role === "owner" && <Shield className="mr-1 h-3 w-3" />}
                    {roleLabels[member.role]}
                  </Badge>
                  {canEditMember && (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setOpenDropdown(openDropdown === member.id ? null : member.id)
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {openDropdown === member.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenDropdown(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-20">
                            <div className="py-1">
                              <p className="px-3 py-1 text-xs font-medium text-slate-500 uppercase">
                                Change Role
                              </p>
                              {currentUserRole === "owner" && member.role !== "owner" && (
                                <button
                                  onClick={() => handleRoleChange(member.id, "owner")}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:opacity-50"
                                  disabled={actionLoading === member.id}
                                >
                                  Make Owner
                                </button>
                              )}
                              {member.role !== "admin" && (
                                <button
                                  onClick={() => handleRoleChange(member.id, "admin")}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:opacity-50"
                                  disabled={actionLoading === member.id}
                                >
                                  Make Admin
                                </button>
                              )}
                              {member.role !== "member" && (
                                <button
                                  onClick={() => handleRoleChange(member.id, "member")}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:opacity-50"
                                  disabled={actionLoading === member.id}
                                >
                                  Make Member
                                </button>
                              )}
                              {member.role !== "viewer" && (
                                <button
                                  onClick={() => handleRoleChange(member.id, "viewer")}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:opacity-50"
                                  disabled={actionLoading === member.id}
                                >
                                  Make Viewer
                                </button>
                              )}
                              <div className="border-t border-slate-200 my-1" />
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                                disabled={actionLoading === member.id}
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove from Team
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Role Permissions</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-slate-600" />
              <span className="font-medium text-slate-900">Owner</span>
            </div>
            <p className="text-sm text-slate-600">
              Full access. Can manage billing, delete organization, and transfer ownership.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <span className="font-medium text-slate-900">Admin</span>
            <p className="text-sm text-slate-600">
              Can manage team members, invite users, and access all features.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <span className="font-medium text-slate-900">Member</span>
            <p className="text-sm text-slate-600">
              Can make donations, view history, and manage their own profile.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <span className="font-medium text-slate-900">Viewer</span>
            <p className="text-sm text-slate-600">
              Read-only access. Can view donations and reports but cannot make changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
