"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Heart, ArrowRight, AlertCircle, CheckCircle, Mail, LogIn } from "lucide-react";

export default function InvitePage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const router = useRouter();

  const handleCheckAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setHasAccess(null);

    try {
      const res = await fetch("/api/check-beta-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (data.hasAccess) {
        setHasAccess(true);
        // Trigger the welcome modal to show after they navigate
        localStorage.setItem("donorx_beta_welcome_trigger", "true");
      } else {
        setHasAccess(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <Heart className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">DonorX</h1>
          <p className="text-slate-600 mt-2">Private Beta</p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mx-auto mb-3">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Invite Only</CardTitle>
          </CardHeader>
          <CardContent>
            {hasAccess === true ? (
              // Access granted - show login/register options
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You have beta access!</span>
                </div>
                <p className="text-sm text-slate-600">
                  Log in or create an account to continue.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <Button asChild className="w-full">
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Log In
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/register">
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : hasAccess === false ? (
              // Access denied
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">No beta access found</span>
                </div>
                <p className="text-sm text-slate-600">
                  The email <strong>{email}</strong> is not on our beta list.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setHasAccess(null);
                    setEmail("");
                  }}
                >
                  Try a different email
                </Button>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Think this is a mistake?{" "}
                    <a
                      href="mailto:support@jbcre8iv.com"
                      className="text-emerald-600 hover:underline"
                    >
                      Contact us
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              // Initial state - show email form
              <>
                <p className="text-sm text-slate-600 text-center mb-6">
                  DonorX is currently in private beta. Enter your email to check if you have access.
                </p>

                <form onSubmit={handleCheckAccess} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!email.trim() || isLoading}
                  >
                    {isLoading ? (
                      "Checking..."
                    ) : (
                      <>
                        Check Access
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs text-slate-500 text-center">
                    Don&apos;t have access?{" "}
                    <a
                      href="mailto:support@jbcre8iv.com"
                      className="text-emerald-600 hover:underline"
                    >
                      Request an invite
                    </a>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          The giving platform for corporations and family offices.
        </p>
      </div>
    </div>
  );
}
