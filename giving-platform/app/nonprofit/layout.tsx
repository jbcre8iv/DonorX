import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Building2, LayoutDashboard, FileText, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const nonprofitLinks = [
  { href: "/nonprofit", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nonprofit/reports", label: "Impact Reports", icon: FileText },
  { href: "/nonprofit/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/nonprofit/settings", label: "Settings", icon: Settings },
];

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

  // Check if user is associated with a nonprofit (for now, any logged-in user can access)
  // In production, you'd want to verify nonprofit admin status

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Building2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Nonprofit Portal</p>
              <p className="text-xs text-slate-500">Manage your organization</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {nonprofitLinks.map((link) => (
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
      </aside>
      <div className="flex-1 overflow-auto bg-slate-50">
        <div className="p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
