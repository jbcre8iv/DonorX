"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile, updatePassword } from "./actions";

interface ProfileFormProps {
  initialFullName: string;
  email: string;
  role: string;
}

export function ProfileForm({ initialFullName, email, role }: ProfileFormProps) {
  const [fullName, setFullName] = React.useState(initialFullName);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges = fullName !== initialFullName;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("fullName", fullName);

    const result = await updateProfile(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" });
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name
          </label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <Input type="email" defaultValue={email} disabled />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
        <div>
          <p className="font-medium text-slate-900">Role</p>
          <p className="text-sm text-slate-600 capitalize">{role}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 capitalize">
          {role}
        </span>
      </div>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
      <div className="pt-2">
        <Button type="submit" disabled={!hasChanges || loading} loading={loading}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}

interface PasswordFormProps {
  onSuccess?: () => void;
}

export function PasswordForm({ onSuccess }: PasswordFormProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Password updated successfully" });
      setIsOpen(false);
      (e.target as HTMLFormElement).reset();
      onSuccess?.();
    }

    setLoading(false);
  }

  if (!isOpen) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
        <div>
          <p className="font-medium text-slate-900">Password</p>
          <p className="text-sm text-slate-600">Change your account password</p>
        </div>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          Change Password
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 p-4 space-y-4">
      <div>
        <p className="font-medium text-slate-900 mb-3">Change Password</p>
        <div className="space-y-3">
          <Input
            name="currentPassword"
            type="password"
            label="Current Password"
            placeholder="Enter current password"
            required
          />
          <Input
            name="newPassword"
            type="password"
            label="New Password"
            placeholder="Enter new password"
            helperText="Must be at least 8 characters"
            required
          />
          <Input
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="Confirm new password"
            required
          />
        </div>
      </div>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>
          Update Password
        </Button>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
