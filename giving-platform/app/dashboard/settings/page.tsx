import { redirect } from "next/navigation";
import { User, Building2, Bell, Shield, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { logout } from "@/app/(auth)/actions";

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

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select(`
      *,
      organization:organizations(*)
    `)
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
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <Input defaultValue={profile?.full_name || ""} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <Input type="email" defaultValue={user.email || ""} disabled />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Role</p>
              <p className="text-sm text-slate-600 capitalize">{profile?.role || "Member"}</p>
            </div>
            <Badge variant="secondary">{profile?.role || "Member"}</Badge>
          </div>
          <div className="pt-4">
            <Button disabled>Save Changes</Button>
            <p className="text-xs text-slate-500 mt-2">Profile editing coming soon</p>
          </div>
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
          </CardContent>
        </Card>
      )}

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
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Password</p>
              <p className="text-sm text-slate-600">Change your account password</p>
            </div>
            <Button variant="outline" disabled>Change Password</Button>
          </div>
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
