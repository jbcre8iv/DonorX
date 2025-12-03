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
  Shield,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
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
  { href: "/admin/beta-testers", label: "Beta Testers", icon: UserCheck, ownerOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  variant: "donor" | "admin";
  userRole?: string | null;
}

export function Sidebar({ variant, userRole }: SidebarProps) {
  const pathname = usePathname();
  const allLinks = variant === "admin" ? adminLinks : donorLinks;
  // Filter out owner-only links if user is not an owner
  const links = allLinks.filter(link => !link.ownerOnly || userRole === "owner");
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

  const isAdmin = variant === "admin";

  return (
    <>
      {/* Mobile header bar with menu toggle */}
      <div className={cn(
        "md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-16 z-40",
        isAdmin
          ? "bg-purple-50 border-purple-200"
          : "bg-white border-slate-200"
      )}>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            "flex items-center gap-2",
            isAdmin
              ? "text-purple-700 hover:text-purple-900"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="font-medium">{currentPage?.label || "Menu"}</span>
        </button>
        {isAdmin && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
            <Shield className="h-3 w-3" />
            Admin
          </span>
        )}
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
          "md:hidden fixed left-0 top-[calc(4rem+49px)] bottom-0 w-64 border-r z-40 transform transition-transform duration-200 ease-in-out no-print",
          isAdmin
            ? "bg-purple-50 border-purple-200"
            : "bg-white border-slate-200",
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
                      ? isAdmin
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-50 text-blue-700"
                      : isAdmin
                        ? "text-purple-900/70 hover:bg-purple-100/50 hover:text-purple-900"
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
      <aside className={cn(
        "hidden md:flex h-full w-64 flex-col border-r no-print",
        isAdmin
          ? "bg-purple-50/50 border-purple-200"
          : "bg-white border-slate-200"
      )}>
        {/* Admin indicator badge */}
        {isAdmin && (
          <div className="px-4 pt-4 pb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
              <Shield className="h-3 w-3" />
              Platform Admin
            </span>
          </div>
        )}
        <div className={cn("flex-1 overflow-y-auto", isAdmin ? "py-2" : "py-6")}>
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
                      ? isAdmin
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-50 text-blue-700"
                      : isAdmin
                        ? "text-purple-900/70 hover:bg-purple-100/50 hover:text-purple-900"
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
