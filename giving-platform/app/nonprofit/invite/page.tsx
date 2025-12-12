import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AcceptInvitationForm } from "./accept-form";
import type { Nonprofit, NonprofitInvitation } from "@/types/database";

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = {
  title: "Accept Nonprofit Invitation",
};

export default async function NonprofitInvitePage({ searchParams }: InvitePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Invalid Invitation Link
            </h1>
            <p className="text-slate-600 mb-6">
              This invitation link is missing the required token. Please check your
              email for the correct link.
            </p>
            <Link
              href="/"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Go to Homepage
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  // Get invitation with nonprofit info
  const { data: invitation, error } = await supabase
    .from("nonprofit_invitations")
    .select(`
      *,
      nonprofit:nonprofits(id, name, logo_url, status)
    `)
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Invitation Not Found
            </h1>
            <p className="text-slate-600 mb-6">
              This invitation link is invalid or has already been used.
              Please contact the person who invited you.
            </p>
            <Link
              href="/"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Go to Homepage
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typedInvitation = invitation as NonprofitInvitation & { nonprofit: Nonprofit };

  // Check if already accepted
  if (typedInvitation.accepted_at) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Invitation Already Accepted
            </h1>
            <p className="text-slate-600 mb-6">
              This invitation has already been accepted. You can access the
              nonprofit portal by logging in.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Log In
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if expired
  const isExpired = new Date(typedInvitation.expires_at) < new Date();
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Invitation Expired
            </h1>
            <p className="text-slate-600 mb-6">
              This invitation has expired. Please contact the nonprofit
              administrator to request a new invitation.
            </p>
            <Link
              href="/"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Go to Homepage
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If logged in, check if they're already a member
  if (user) {
    const { data: existingMembership } = await supabase
      .from("nonprofit_users")
      .select("id")
      .eq("nonprofit_id", typedInvitation.nonprofit_id)
      .eq("user_id", user.id)
      .single();

    if (existingMembership) {
      redirect("/nonprofit");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {typedInvitation.nonprofit.logo_url ? (
            <img
              src={typedInvitation.nonprofit.logo_url}
              alt={typedInvitation.nonprofit.name}
              className="h-16 w-16 rounded-xl object-contain mx-auto mb-4"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-100 mx-auto mb-4">
              <Building2 className="h-8 w-8 text-emerald-700" />
            </div>
          )}
          <CardTitle>Join {typedInvitation.nonprofit.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to manage this nonprofit organization
            as {typedInvitation.role === "admin" ? "an administrator" : `a ${typedInvitation.role}`}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInvitationForm
            invitation={typedInvitation}
            isLoggedIn={!!user}
            userEmail={user?.email}
          />
        </CardContent>
      </Card>
    </div>
  );
}
