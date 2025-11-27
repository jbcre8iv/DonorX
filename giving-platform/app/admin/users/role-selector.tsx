"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { updateUserRole } from "./actions";

type UserRole = "owner" | "admin" | "member" | "viewer";

interface RoleSelectorProps {
  userId: string;
  currentRole: UserRole;
  isCurrentUser: boolean;
  currentUserRole: UserRole;
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full platform access" },
  { value: "member", label: "Member", description: "Standard user access" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
];

export function RoleSelector({
  userId,
  currentRole,
  isCurrentUser,
  currentUserRole,
}: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only owners can change roles
  const canChangeRoles = currentUserRole === "owner" && !isCurrentUser && currentRole !== "owner";

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === currentRole) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await updateUserRole(userId, newRole);

    if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
    setIsOpen(false);
  };

  if (!canChangeRoles) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            Change
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRoleChange(option.value)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  currentRole === option.value ? "bg-blue-50 text-blue-700" : "text-slate-700"
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-slate-500">{option.description}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
