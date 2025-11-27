"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile, updatePassword, updateAvatar, removeAvatar } from "./actions";

interface AvatarUploadProps {
  initialAvatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export function AvatarUpload({ initialAvatarUrl, firstName, lastName, email }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = React.useState(initialAvatarUrl);
  const [uploading, setUploading] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Generate initials from first and last name
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };
  const initials = getInitials();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("avatar", file);

    const result = await updateAvatar(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result.avatarUrl) {
      setAvatarUrl(result.avatarUrl);
      setMessage({ type: "success", text: "Profile picture updated" });
    }

    setUploading(false);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setMessage(null);

    const result = await removeAvatar();

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setAvatarUrl(null);
      setMessage({ type: "success", text: "Profile picture removed" });
    }

    setRemoving(false);
  }

  return (
    <div className="flex items-start gap-6 pb-6 border-b border-slate-200 mb-6">
      <div className="relative group">
        <div className="h-20 w-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile picture"
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-2xl font-semibold text-blue-700">{initials}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-slate-900">Profile Picture</h3>
        <p className="text-sm text-slate-600 mt-1">
          Upload a photo or logo. Max size 2MB.
        </p>
        <div className="flex gap-2 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Photo"
            )}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </>
              )}
            </Button>
          )}
        </div>
        {message && (
          <p className={`text-sm mt-2 ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

interface ProfileFormProps {
  initialFirstName: string;
  initialLastName: string;
  email: string;
  role: string;
}

export function ProfileForm({ initialFirstName, initialLastName, email, role }: ProfileFormProps) {
  const [firstName, setFirstName] = React.useState(initialFirstName);
  const [lastName, setLastName] = React.useState(initialLastName);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges = firstName !== initialFirstName || lastName !== initialLastName;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);

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
            First Name
          </label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Last Name
          </label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <Input type="email" defaultValue={email} disabled />
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
