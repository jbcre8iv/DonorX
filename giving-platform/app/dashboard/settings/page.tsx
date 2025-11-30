import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Building2, Bell, Shield, LogOut, Globe, ExternalLink, Users, ChevronRight } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { logout } from "@/app/(auth)/actions";
import { AvatarUpload, ProfileForm, PasswordForm } from "./settings-forms";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile using admin client to bypass RLS issues
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("id", user.id)
    .single();

  // Get public profile settings
  const { data: publicProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-slate-600" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            initialAvatarUrl={profile?.avatar_url || null}
            firstName={profile?.first_name || null}
            lastName={profile?.last_name || null}
            email={user.email || ""}
          />
          <ProfileForm
            initialFirstName={profile?.first_name || ""}
            initialLastName={profile?.last_name || ""}
            email={user.email || ""}
            role={profile?.role || "Member"}
          />
        </CardContent>
      </Card>

      {/* Organization Settings */}
      {profile?.organization && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-600" />
              <CardTitle>Organization</CardTitle>
            </div>
            <CardDescription>Your organization&apos;s details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization Name
                </label>
                <Input defaultValue={profile.organization.name || ""} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Website
                </label>
                <Input defaultValue={profile.organization.website || ""} disabled />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div>
                <p className="font-medium text-slate-900">Organization Type</p>
                <p className="text-sm text-slate-600 capitalize">
                  {profile.organization.type?.replace("_", " ") || "Not specified"}
                </p>
              </div>
              <Badge variant="secondary">
                {profile.organization.type?.replace("_", " ") || "Organization"}
              </Badge>
            </div>
            {/* Team Management Link */}
            <Link
              href="/dashboard/settings/team"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Team Management</p>
                  <p className="text-sm text-slate-600">
                    Invite members and manage roles
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Public Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-slate-600" />
            <CardTitle>Public Profile</CardTitle>
          </div>
          <CardDescription>Control what others can see about your giving</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Profile Visibility</p>
              <p className="text-sm text-slate-600">
                Make your giving profile visible to others
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                defaultChecked={publicProfile?.is_public ?? false}
                className="peer sr-only"
                disabled
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-700 peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <Input
                defaultValue={publicProfile?.username || ""}
                placeholder="your-username"
                disabled
              />
              <p className="text-xs text-slate-500 mt-1">
                Your profile URL: /donors/{publicProfile?.username || "username"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Display Name
              </label>
              <Input
                defaultValue={publicProfile?.display_name || ""}
                placeholder="Your Name"
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bio
            </label>
            <textarea
              defaultValue={publicProfile?.bio || ""}
              placeholder="Tell others about your giving journey..."
              rows={3}
              disabled
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Privacy Options</p>
            {[
              {
                key: "show_donation_stats",
                title: "Show Donation Stats",
                description: "Display total given, donation count, and nonprofits supported",
              },
              {
                key: "show_supported_nonprofits",
                title: "Show Supported Nonprofits",
                description: "Display the organizations you've supported",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    defaultChecked={
                      publicProfile?.[item.key as keyof typeof publicProfile] ?? true
                    }
                    className="peer sr-only"
                    disabled
                  />
                  <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-700 peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            ))}
          </div>

          {publicProfile?.is_public && publicProfile?.username && (
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/donors/${publicProfile.username}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Public Profile
                </Link>
              </Button>
            </div>
          )}

          <p className="text-xs text-slate-500">Profile editing coming soon</p>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-600" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure your email preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              title: "Donation Confirmations",
              description: "Receive email confirmations for each donation",
              defaultChecked: true,
            },
            {
              title: "Tax Receipts",
              description: "Get notified when quarterly receipts are ready",
              defaultChecked: true,
            },
            {
              title: "Impact Reports",
              description: "Receive impact updates from supported nonprofits",
              defaultChecked: true,
            },
            {
              title: "Newsletter",
              description: "Stay updated with platform news and features",
              defaultChecked: false,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  defaultChecked={item.defaultChecked}
                  className="peer sr-only"
                  disabled
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-700 peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          ))}
          <p className="text-xs text-slate-500">Notification preferences coming soon</p>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-600" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PasswordForm />
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Two-Factor Authentication</p>
              <p className="text-sm text-slate-600">Add an extra layer of security</p>
            </div>
            <Button variant="outline" disabled>Enable</Button>
          </div>
        </CardContent>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-slate-600" />
            <CardTitle>Session</CardTitle>
          </div>
          <CardDescription>Manage your current session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Sign Out</p>
              <p className="text-sm text-slate-600">
                Sign out of your account on this device
              </p>
            </div>
            <form action={logout}>
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">User ID</span>
              <span className="font-mono text-slate-900">{user.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Created</span>
              <span className="text-slate-900">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Sign In</span>
              <span className="text-slate-900">
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
