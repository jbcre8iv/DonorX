import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  Building2,
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  Target,
  Users,
  UserCircle,
  Code,
} from "lucide-react";
import type { Nonprofit, NonprofitUser } from "@/types/database";

const nonprofitLinks = [
  { href: "/nonprofit", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nonprofit/profile", label: "Profile", icon: UserCircle },
  { href: "/nonprofit/goals", label: "Fundraising Goals", icon: Target },
  { href: "/nonprofit/reports", label: "Impact Reports", icon: FileText },
  { href: "/nonprofit/widget", label: "Donation Widget", icon: Code },
  { href: "/nonprofit/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/nonprofit/team", label: "Team", icon: Users, adminOnly: true },
  { href: "/nonprofit/settings", label: "Settings", icon: Settings },
];

export type NonprofitContext = {
  nonprofit: Nonprofit;
  nonprofitUser: NonprofitUser;
};

export default async function NonprofitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is associated with a nonprofit via nonprofit_users table
  // Use admin client to bypass RLS complexity
  const adminClient = createAdminClient();
  const { data: nonprofitUser } = await adminClient
    .from("nonprofit_users")
    .select(`
      *,
      nonprofit:nonprofits(*)
    `)
    .eq("user_id", user.id)
    .single();

  // If user is not associated with any nonprofit, show access denied
  if (!nonprofitUser) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-4">
          <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Nonprofit Portal Access
          </h1>
          <p className="text-slate-600 mb-6">
            You don&apos;t have access to any nonprofit organization yet. If your
            nonprofit was recently approved, check your email for an invitation link.
          </p>
          <div className="space-y-3">
            <Link
              href="/apply"
              className="block w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Apply as a Nonprofit
            </Link>
            <Link
              href="/"
              className="block w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const nonprofit = nonprofitUser.nonprofit as unknown as Nonprofit;
  const isAdmin = nonprofitUser.role === "admin";

  // Filter links based on user role
  const visibleLinks = nonprofitLinks.filter((link) => {
    if ("adminOnly" in link && link.adminOnly) {
      return isAdmin;
    }
    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {nonprofit.logo_url ? (
              <img
                src={nonprofit.logo_url}
                alt={nonprofit.name}
                className="h-10 w-10 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Building2 className="h-5 w-5 text-emerald-700" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{nonprofit.name}</p>
              <p className="text-xs text-slate-500 capitalize">{nonprofitUser.role}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {nonprofit.status === "pending" && (
          <div className="p-3 border-t border-slate-200">
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <p className="font-medium">Pending Approval</p>
              <p className="mt-1">Your nonprofit is awaiting admin review.</p>
            </div>
          </div>
        )}
      </aside>
      <div className="flex-1 overflow-auto bg-slate-50">
        <div className="p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
