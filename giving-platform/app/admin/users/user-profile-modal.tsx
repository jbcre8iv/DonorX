"use client";

import { useState } from "react";
import { X, Building2, Globe, Calendar, Shield, UserCheck, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

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

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
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

const orgTypeLabels: Record<string, string> = {
  corporation: "Corporation",
  family_office: "Family Office",
  foundation: "Foundation",
  individual: "Individual",
};

export function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  const fullName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.first_name || "—";
  const initials = user.first_name
    ? `${user.first_name.charAt(0)}${user.last_name?.charAt(0) || ""}`
    : user.email.charAt(0).toUpperCase();
  const role = user.role || null;
  const RoleIcon = role ? roleIcons[role] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">User Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* User Avatar & Name */}
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={fullName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-lg font-semibold">
                {initials.toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-900">{fullName}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400">Registered</p>
                <p className="text-slate-600">{formatDate(user.created_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <Badge
                  variant={user.status === "approved" ? "success" : user.status === "pending" ? "warning" : "secondary"}
                  className="capitalize"
                >
                  {user.status}
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-2">
              {role && RoleIcon ? (
                <>
                  <RoleIcon className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Role</p>
                    <Badge variant={roleColors[role]} className="capitalize">
                      {role}
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Role</p>
                    <Badge variant="secondary">User</Badge>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-start gap-2">
              <UserCheck className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400">Approved</p>
                <p className="text-slate-600">{user.approved_at ? formatDate(user.approved_at) : "—"}</p>
              </div>
            </div>
          </div>

          {/* Organization */}
          {user.organization && (
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              {user.organization.logo_url ? (
                <img
                  src={user.organization.logo_url}
                  alt={user.organization.name}
                  className="h-9 w-9 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-200 text-slate-500 flex-shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="font-medium text-slate-900 text-sm">{user.organization.name}</p>
                <p className="text-xs text-slate-500">
                  {orgTypeLabels[user.organization.type] || user.organization.type}
                </p>
              </div>
            </div>
          )}

          {/* User ID */}
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            ID: <span className="font-mono">{user.id}</span>
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ViewProfileButtonProps {
  user: User;
}

export function ViewProfileButton({ user }: ViewProfileButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className="text-slate-600 hover:text-slate-900"
      >
        <Eye className="h-3.5 w-3.5 mr-1" />
        View
      </Button>

      {showModal && (
        <UserProfileModal user={user} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
