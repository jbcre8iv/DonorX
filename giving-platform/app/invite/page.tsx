"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Heart, ArrowRight, AlertCircle } from "lucide-react";

export default function InvitePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/verify-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError("Invalid invite code. Please try again.");
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
            <p className="text-sm text-slate-600 text-center mb-6">
              DonorX is currently in private beta. Enter your invite code to get early access.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter invite code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="text-center text-lg tracking-widest uppercase"
                  maxLength={20}
                  autoFocus
                />
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
                disabled={!code.trim() || isLoading}
              >
                {isLoading ? (
                  "Verifying..."
                ) : (
                  <>
                    Enter Beta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-500 text-center">
                Don&apos;t have an invite code?{" "}
                <a
                  href="mailto:hello@donorx.com"
                  className="text-emerald-600 hover:underline"
                >
                  Request access
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          The giving platform for corporations and family offices.
        </p>
      </div>
    </div>
  );
}
