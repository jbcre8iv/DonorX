"use client";

import { useState } from "react";
import { UserPlus, Mail, Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendTeamInvitation } from "./invitation-actions";

const roleOptions = [
  { value: "admin", label: "Admin - Full platform access" },
  { value: "member", label: "Member - Standard team access" },
  { value: "viewer", label: "Viewer - Read-only access" },
];

export function InviteTeamMemberForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);

    const result = await sendTeamInvitation(email.trim(), role);

    setLoading(false);

    if (result.error && !result.success) {
      setError(result.error);
      return;
    }

    if (result.success) {
      setSuccess(result.error || `Invitation sent to ${email}`);
      setEmail("");
      setRole("member");

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    }
  }

  return (
    <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-emerald-900">
          <UserPlus className="h-5 w-5" />
          Invite Team Member
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-emerald-800 mb-4">
          Send a secure invitation email to add a new team member. They&apos;ll receive a link to create their account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {success}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <Input
                label="Email Address"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="sm:col-span-1">
              <Select
                label="Role"
                options={roleOptions}
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "member" | "viewer")}
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-emerald-700 bg-white/50 rounded-lg p-3">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Security:</strong> Invitation links are encrypted, single-use, and expire after 7 days.
              The recipient must use the exact email address the invitation was sent to.
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            <Mail className="h-4 w-4 mr-2" />
            Send Invitation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
