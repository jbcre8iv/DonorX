import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Building2 } from "lucide-react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AcceptInvitationForm } from "./accept-form";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata() {
  return { title: "Team Invitation - DonorX" };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const adminClient = createAdminClient();
  const supabase = await createClient();

  // Get current user if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the invitation
  const { data: invitation, error } = await adminClient
    .from("team_invitations")
    .select(`
      *,
      organization:organizations(id, name, type),
      inviter:users!invited_by(first_name, last_name, email)
    `)
    .eq("token", token)
    .single();

  if (error || !invitation) {
    notFound();
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAccepted = invitation.status === "accepted";
  const isCanceled = invitation.status === "canceled";
  const isPending = invitation.status === "pending" && !isExpired;

  // Check if the current user's email matches the invitation
  const emailMatches = user?.email?.toLowerCase() === invitation.email.toLowerCase();

  // If invitation is valid and user is logged in with matching email,
  // check if they're already in the org
  let alreadyMember = false;
  if (user && emailMatches) {
    const { data: existingMember } = await adminClient
      .from("users")
      .select("id")
      .eq("id", user.id)
      .eq("organization_id", invitation.organization_id)
      .single();

    alreadyMember = !!existingMember;
  }

  const inviterName = invitation.inviter?.first_name && invitation.inviter?.last_name
    ? `${invitation.inviter.first_name} ${invitation.inviter.last_name}`
    : invitation.inviter?.email || "A team member";

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    member: "Member",
    viewer: "Viewer",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-blue-700" />
          </div>
          <CardTitle className="text-2xl">Team Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Expired */}
          {isExpired && !isAccepted && (
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Invitation Expired</h3>
                <p className="text-slate-600 mt-1">
                  This invitation has expired. Please contact {inviterName} to request a new one.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          )}

          {/* Canceled */}
          {isCanceled && (
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Invitation Canceled</h3>
                <p className="text-slate-600 mt-1">
                  This invitation has been canceled. Please contact {inviterName} if you believe this is an error.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          )}

          {/* Already accepted */}
          {isAccepted && (
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Invitation Already Accepted</h3>
                <p className="text-slate-600 mt-1">
                  This invitation has already been used. You can access your dashboard below.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}

          {/* Already a member */}
          {isPending && alreadyMember && (
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Already a Member</h3>
                <p className="text-slate-600 mt-1">
                  You&apos;re already a member of {invitation.organization?.name}.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}

          {/* Valid invitation */}
          {isPending && !alreadyMember && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-slate-600">
                  <strong>{inviterName}</strong> has invited you to join
                </p>
                <h3 className="text-xl font-semibold text-slate-900 mt-1">
                  {invitation.organization?.name}
                </h3>
                <p className="text-slate-500 mt-2">
                  as a <strong>{roleLabels[invitation.role]}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 justify-center">
                <Clock className="h-4 w-4" />
                <span>
                  Expires {new Date(invitation.expires_at).toLocaleDateString()}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-6">
                {user && emailMatches ? (
                  <AcceptInvitationForm token={token} />
                ) : user && !emailMatches ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                      <p className="text-sm text-amber-800">
                        This invitation was sent to <strong>{invitation.email}</strong>, but you&apos;re logged in as <strong>{user.email}</strong>.
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 text-center">
                      Please log out and sign in with the correct account, or register with the invited email.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/login?redirect=/invite/${token}`}>Switch Account</Link>
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href={`/register?email=${encodeURIComponent(invitation.email)}&redirect=/invite/${token}`}>
                          Create Account
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 text-center">
                      Sign in or create an account to accept this invitation.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/login?redirect=/invite/${token}`}>Sign In</Link>
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href={`/register?email=${encodeURIComponent(invitation.email)}&redirect=/invite/${token}`}>
                          Create Account
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
