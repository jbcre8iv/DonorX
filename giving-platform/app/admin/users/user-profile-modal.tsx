"use client";

import { useState } from "react";
import { X, Mail, Building2, Globe, Calendar, Shield, UserCheck, Users, Eye } from "lucide-react";
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
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">User Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Avatar & Name */}
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={fullName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xl font-semibold">
                {initials.toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{fullName}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
              {role && RoleIcon && (
                <Badge variant={roleColors[role]} className="mt-1 capitalize">
                  <RoleIcon className="mr-1 h-3 w-3" />
                  {role}
                </Badge>
              )}
              {!role && (
                <Badge variant="secondary" className="mt-1">
                  Registered User
                </Badge>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wide">
              Account Details
            </h4>

            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Email</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Joined</p>
                  <p className="text-sm text-slate-600">{formatDate(user.created_at)}</p>
                </div>
              </div>

              {user.approved_at && (
                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Approved</p>
                    <p className="text-sm text-slate-600">{formatDate(user.approved_at)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Status</p>
                  <Badge
                    variant={user.status === "approved" ? "success" : user.status === "pending" ? "warning" : "secondary"}
                    className="capitalize"
                  >
                    {user.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Organization */}
          {user.organization && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wide">
                Organization
              </h4>

              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  {user.organization.logo_url ? (
                    <img
                      src={user.organization.logo_url}
                      alt={user.organization.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-200 text-slate-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{user.organization.name}</p>
                    <p className="text-sm text-slate-500">
                      {orgTypeLabels[user.organization.type] || user.organization.type}
                    </p>
                  </div>
                </div>

                {user.organization.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <a
                      href={user.organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {user.organization.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User ID (for debugging/reference) */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              User ID: <span className="font-mono">{user.id}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>
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
