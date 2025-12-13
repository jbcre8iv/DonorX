import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Building2, Globe, Mail, ExternalLink, AlertTriangle } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Nonprofit } from "@/types/database";

export const metadata = {
  title: "Settings - Nonprofit Portal",
};

export default async function NonprofitSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get nonprofit from user's nonprofit_users record
  const adminClient = createAdminClient();
  const { data: nonprofitUser } = await adminClient
    .from("nonprofit_users")
    .select(`
      *,
      nonprofit:nonprofits(*)
    `)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser) {
    redirect("/nonprofit");
  }

  const nonprofit = nonprofitUser.nonprofit as unknown as Nonprofit;
  const isAdmin = nonprofitUser.role === "admin";

  // Get team member count
  const { count: teamCount } = await supabase
    .from("nonprofit_users")
    .select("id", { count: "exact", head: true })
    .eq("nonprofit_id", nonprofit.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-600">
          Manage your nonprofit organization settings.
        </p>
      </div>

      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {nonprofit.logo_url ? (
              <img
                src={nonprofit.logo_url}
                alt={nonprofit.name}
                className="h-16 w-16 rounded-lg object-contain border border-slate-200"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{nonprofit.name}</h3>
              {nonprofit.ein && (
                <p className="text-sm text-slate-500">EIN: {nonprofit.ein}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={nonprofit.status === "approved" ? "success" : "secondary"}>
                  {nonprofit.status}
                </Badge>
                {nonprofit.featured && (
                  <Badge variant="default">Featured</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/nonprofit/profile">
                Edit Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Globe className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Public Profile</h3>
                <p className="text-sm text-slate-500">View your public page</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={`/directory/${nonprofit.id}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Mail className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Contact Email</h3>
                <p className="text-sm text-slate-500 truncate max-w-[150px]">
                  {nonprofit.contact_email || "Not set"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/nonprofit/profile">
                Update Contact
              </Link>
            </Button>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Settings className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Team Members</h3>
                  <p className="text-sm text-slate-500">{teamCount || 0} members</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/nonprofit/team">
                  Manage Team
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Account</CardTitle>
          <CardDescription>
            Your access level and account information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Email</span>
              <span className="font-medium text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Role</span>
              <Badge variant={nonprofitUser.role === "admin" ? "success" : "default"}>
                {nonprofitUser.role}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Member Since</span>
              <span className="font-medium text-slate-900">
                {new Date(nonprofitUser.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Admin Only */}
      {isAdmin && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions. Please be careful.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-red-200 p-4">
              <h4 className="font-medium text-slate-900 mb-1">
                Request Account Deletion
              </h4>
              <p className="text-sm text-slate-600 mb-3">
                To delete your nonprofit account and all associated data, please contact
                our support team. This action cannot be undone.
              </p>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <h3 className="font-medium text-slate-900 mb-2">Need Help?</h3>
            <p className="text-sm text-slate-600 mb-3">
              If you have questions about managing your nonprofit portal or need assistance,
              our support team is here to help.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:support@donorx.org">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
