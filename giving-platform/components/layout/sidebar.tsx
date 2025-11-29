"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  Receipt,
  Layers,
  Settings,
  Building2,
  CreditCard,
  Users,
  BarChart3,
  Tag,
  RefreshCw,
  Newspaper,
  FileBarChart,
  Sparkles,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const donorLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
  { href: "/dashboard/history", label: "Donation History", icon: History },
  { href: "/dashboard/subscriptions", label: "Recurring", icon: RefreshCw },
  { href: "/dashboard/impact", label: "Impact Feed", icon: Newspaper },
  { href: "/dashboard/reports", label: "Quarterly Reports", icon: FileBarChart },
  { href: "/dashboard/ai", label: "AI Tools", icon: Sparkles },
  { href: "/dashboard/receipts", label: "Tax Receipts", icon: Receipt },
  { href: "/dashboard/templates", label: "Templates", icon: Layers },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminLinks: SidebarLink[] = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/nonprofits", label: "Nonprofits", icon: Building2 },
  { href: "/admin/donations", label: "Donations", icon: CreditCard },
  { href: "/admin/donors", label: "Donors", icon: Heart },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/users", label: "Team", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  variant: "donor" | "admin";
}

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const links = variant === "admin" ? adminLinks : donorLinks;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close mobile sidebar when route changes
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Get current page title for mobile header
  const currentPage = links.find(
    (link) =>
      pathname === link.href ||
      (link.href !== "/dashboard" &&
        link.href !== "/admin" &&
        pathname.startsWith(link.href))
  );

  return (
    <>
      {/* Mobile header bar with menu toggle */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-16 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="font-medium">{currentPage?.label || "Menu"}</span>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 top-[calc(4rem+49px)] bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "md:hidden fixed left-0 top-[calc(4rem+49px)] bottom-0 w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-200 ease-in-out no-print",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" &&
                  link.href !== "/admin" &&
                  pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Desktop sidebar - always visible */}
      <aside className="hidden md:flex h-full w-64 flex-col border-r border-slate-200 bg-white no-print">
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" &&
                  link.href !== "/admin" &&
                  pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
