"use client";

import { useState } from "react";
import Link from "next/link";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { register } from "../actions";

const organizationTypes = [
  { value: "corporation", label: "Corporation" },
  { value: "family_office", label: "Family Office" },
  { value: "foundation", label: "Foundation" },
  { value: "individual", label: "Individual" },
];

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Basic validation
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const result = await register(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If successful, the action will redirect
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Get started with {config.appName} for free
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Input
              name="organizationName"
              label="Organization Name"
              type="text"
              placeholder="Acme Corporation"
              required
            />
            <Select
              name="organizationType"
              label="Organization Type"
              options={organizationTypes}
              defaultValue="corporation"
            />
            <Input
              name="fullName"
              label="Your Full Name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              required
            />
            <Input
              name="email"
              label="Work Email"
              type="email"
              placeholder="jane@acme.com"
              autoComplete="email"
              required
            />
            <Input
              name="password"
              label="Password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              helperText="Must be at least 8 characters"
              required
            />
            <Input
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
            <div className="text-sm text-slate-600">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-blue-700 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-700 hover:underline">
                Privacy Policy
              </Link>
              .
            </div>
            <Button type="submit" fullWidth loading={loading}>
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
