"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Loader2, AlertCircle, CheckCircle, Lock, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateInvitationToken, acceptInvitation } from "@/app/admin/users/invitation-actions";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState<{
    valid: boolean;
    email?: string;
    role?: string;
    error?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    async function validate() {
      if (!token) {
        setInviteData({ valid: false, error: "No invitation token provided" });
        setValidating(false);
        return;
      }

      const result = await validateInvitationToken(token);
      setInviteData(result);
      setValidating(false);
    }

    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("Please enter your full name");
      return;
    }

    setSubmitting(true);

    const result = await acceptInvitation(
      token!,
      formData.password,
      formData.firstName.trim(),
      formData.lastName.trim()
    );

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccess(true);

    // Redirect to login after brief delay
    setTimeout(() => {
      router.push("/login?message=Account created successfully. Please sign in.");
    }, 2000);
  }

  // Loading state
  if (validating) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <p className="text-slate-600">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (!inviteData?.valid) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Invalid Invitation</h2>
            <p className="text-slate-600 mb-6">{inviteData?.error || "This invitation link is invalid or has expired."}</p>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Account Created!</h2>
            <p className="text-slate-600 mb-2">Your team account has been set up successfully.</p>
            <p className="text-sm text-slate-500">Redirecting to sign in...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form
  const roleDisplay = inviteData.role ? inviteData.role.charAt(0).toUpperCase() + inviteData.role.slice(1) : "Member";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join the DonorX Team</CardTitle>
          <CardDescription>
            Complete your account setup to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invitation details */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">{inviteData.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Role:</span>
              <Badge variant="success" className="capitalize">
                {roleDisplay}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                type="text"
                placeholder="Jane"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                autoComplete="given-name"
                required
              />
              <Input
                label="Last Name"
                type="text"
                placeholder="Smith"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                autoComplete="family-name"
                required
              />
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="new-password"
              helperText="Must be at least 8 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              autoComplete="new-password"
              required
            />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Lock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                This invitation is for <strong>{inviteData.email}</strong> only. Your account will be created with this email address.
              </p>
            </div>

            <Button type="submit" fullWidth loading={submitting}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-700 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
          <p className="text-slate-600">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInviteForm />
    </Suspense>
  );
}
