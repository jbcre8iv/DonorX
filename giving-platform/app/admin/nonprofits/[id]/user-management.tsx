"use client";

import { useState, useTransition } from "react";
import { Users, UserPlus, Trash2, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { linkUserToNonprofit, removeUserFromNonprofit, changeUserRole } from "../actions";

interface NonprofitUser {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
}

interface UserManagementProps {
  nonprofitId: string;
  nonprofitName: string;
  users: NonprofitUser[];
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const roleBadgeVariants: Record<string, "success" | "default" | "secondary"> = {
  admin: "success",
  editor: "default",
  viewer: "secondary",
};

export function UserManagement({ nonprofitId, nonprofitName, users }: UserManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: NonprofitUser | null }>({
    open: false,
    user: null,
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    startTransition(async () => {
      const result = await linkUserToNonprofit(nonprofitId, email.trim(), role);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Successfully linked ${email} as ${role}`);
        setEmail("");
        setRole("viewer");
      }
    });
  };

  const handleRoleChange = (userId: string, newRole: "admin" | "editor" | "viewer") => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await changeUserRole(nonprofitId, userId, newRole);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Role updated successfully");
      }
    });
  };

  const openDeleteModal = (user: NonprofitUser) => {
    setDeleteModal({ open: true, user });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, user: null });
  };

  const confirmRemove = () => {
    if (!deleteModal.user) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await removeUserFromNonprofit(nonprofitId, deleteModal.user!.userId);
      if (result.error) {
        setError(result.error);
        closeDeleteModal();
      } else {
        setSuccess(`${deleteModal.user!.email} has been removed`);
        closeDeleteModal();
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage users who have access to the {nonprofitName} nonprofit portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* Add User Form */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Link a User
            </h4>
            <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="User's email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="sm:w-32">
                <Select
                  options={roleOptions}
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "editor" | "viewer")}
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding..." : "Add User"}
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              The user must already have an account on DonorX. If they don&apos;t, ask them to register first.
            </p>
          </div>

          {/* Current Users */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">
              Current Users ({users.length})
            </h4>
            {users.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No users linked to this nonprofit yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {user.fullName || user.email}
                      </p>
                      {user.fullName && (
                        <p className="text-sm text-slate-500">{user.email}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        Added {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        options={roleOptions}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.userId, e.target.value as "admin" | "editor" | "viewer")}
                        disabled={isPending}
                        className="w-28"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => openDeleteModal(user)}
                        disabled={isPending}
                        title="Remove user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Legend */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Permissions
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Admin:</strong> Full access - can edit profile, manage team, view analytics</li>
              <li><strong>Editor:</strong> Can edit profile and content, but cannot manage team</li>
              <li><strong>Viewer:</strong> Read-only access to the nonprofit portal</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Remove User Confirmation Modal */}
      <Modal open={deleteModal.open} onClose={closeDeleteModal}>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Remove User</h2>
              <p className="text-sm text-slate-500">This will revoke their access</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {deleteModal.user && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 font-semibold">
                  {(deleteModal.user.fullName || deleteModal.user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {deleteModal.user.fullName || deleteModal.user.email}
                  </p>
                  {deleteModal.user.fullName && (
                    <p className="text-sm text-slate-500">{deleteModal.user.email}</p>
                  )}
                  <Badge variant={roleBadgeVariants[deleteModal.user.role]} className="mt-1">
                    {deleteModal.user.role}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to remove this user from <strong>{nonprofitName}</strong>?
                They will no longer be able to access the nonprofit portal.
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={closeDeleteModal} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmRemove} disabled={isPending}>
            {isPending ? "Removing..." : "Remove User"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
