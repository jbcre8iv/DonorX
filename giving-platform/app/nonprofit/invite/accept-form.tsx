"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { acceptInvitation, acceptInvitationWithNewAccount } from "./actions";
import type { NonprofitInvitation, Nonprofit } from "@/types/database";

interface AcceptInvitationFormProps {
  invitation: NonprofitInvitation & { nonprofit: Nonprofit };
  isLoggedIn: boolean;
  userEmail?: string;
}

export function AcceptInvitationForm({
  invitation,
  isLoggedIn,
  userEmail,
}: AcceptInvitationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [mode, setMode] = React.useState<"login" | "signup">("signup");

  // If logged in, just show accept button
  if (isLoggedIn) {
    const handleAccept = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await acceptInvitation(invitation.token);

        if (!result.success) {
          setError(result.error || "Failed to accept invitation");
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/nonprofit");
        }, 1500);
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (success) {
      return (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">Invitation accepted!</p>
          <p className="text-sm text-slate-500 mt-1">Redirecting to portal...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 text-center">
          You&apos;re logged in as <strong>{userEmail}</strong>. Click below to
          accept this invitation.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          onClick={handleAccept}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting...
            </>
          ) : (
            "Accept Invitation"
          )}
        </Button>

        <p className="text-xs text-slate-500 text-center">
          Not you?{" "}
          <a href="/login?redirect=/nonprofit/invite?token=${invitation.token}" className="text-emerald-600 hover:text-emerald-700">
            Log in with a different account
          </a>
        </p>
      </div>
    );
  }

  // Not logged in - show signup/login form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    try {
      const result = await acceptInvitationWithNewAccount(
        invitation.token,
        email,
        password,
        mode === "signup" ? fullName : undefined
      );

      if (!result.success) {
        setError(result.error || "Failed to accept invitation");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        if (result.needsEmailConfirmation) {
          router.push("/login?message=Please check your email to confirm your account");
        } else {
          router.push("/nonprofit");
        }
      }, 1500);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-slate-700 font-medium">Account created!</p>
        <p className="text-sm text-slate-500 mt-1">
          Check your email to confirm your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "signup"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Create Account
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Log In
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <Input
            label="Full Name"
            name="fullName"
            placeholder="Your name"
            required
          />
        )}

        <Input
          label="Email"
          name="email"
          type="email"
          defaultValue={invitation.email}
          placeholder="your@email.com"
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder={mode === "signup" ? "Create a password" : "Your password"}
          required
          minLength={8}
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "signup" ? "Creating Account..." : "Logging In..."}
            </>
          ) : mode === "signup" ? (
            "Create Account & Accept"
          ) : (
            "Log In & Accept"
          )}
        </Button>
      </form>

      <p className="text-xs text-slate-500 text-center">
        By accepting this invitation, you agree to our{" "}
        <a href="/terms" className="text-emerald-600 hover:text-emerald-700">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-emerald-600 hover:text-emerald-700">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
