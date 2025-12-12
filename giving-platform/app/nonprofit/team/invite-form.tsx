"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inviteTeamMember } from "./actions";
import type { NonprofitUserRole } from "@/types/database";

interface InviteTeamMemberFormProps {
  nonprofitId: string;
}

export function InviteTeamMemberForm({ nonprofitId }: InviteTeamMemberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<NonprofitUserRole>("editor");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await inviteTeamMember(nonprofitId, email, role);

      if (!result.success) {
        setError(result.error || "Failed to send invitation");
        return;
      }

      setSuccess(true);
      setEmail("");
      router.refresh();

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { value: NonprofitUserRole; label: string; description: string }[] = [
    { value: "admin", label: "Admin", description: "Full access to all features" },
    { value: "editor", label: "Editor", description: "Can edit profile and create reports" },
    { value: "viewer", label: "Viewer", description: "Read-only access" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="colleague@example.com"
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as NonprofitUserRole)}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            {roles.find((r) => r.value === role)?.description}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-600 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Invitation sent successfully!
        </div>
      )}

      <Button type="submit" disabled={isLoading || !email}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Invitation
          </>
        )}
      </Button>
    </form>
  );
}
