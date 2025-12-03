"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User, LogIn, LayoutDashboard, Settings, Shield, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { logout } from "@/app/(auth)/actions";

interface BottomNavProps {
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    avatarUrl: string | null;
  } | null;
}

// Giving List button for bottom nav
function GivingListNavButton() {
  const { cartItems, setSidebarOpen, hasDraft } = useCartFavorites();

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      className="flex flex-col items-center justify-center gap-1 relative"
    >
      <div className="relative">
        <Heart className={cn(
          "h-6 w-6",
          hasDraft ? "text-emerald-600" : "text-slate-500"
        )} />
        {hasDraft && (
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
        )}
        {!hasDraft && cartItems.length > 0 && (
          <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
            {cartItems.length > 9 ? "9+" : cartItems.length}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[10px] font-medium",
        hasDraft ? "text-emerald-600" : "text-slate-500"
      )}>
        Giving
      </span>
    </button>
  );
}

export function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

  // Helper to get initials
  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  const getFullName = (firstName: string | null, lastName: string | null) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    return null;
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
  };

  // Hide on dashboard and admin pages
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/directory", icon: Search, label: "Directory" },
  ];

  return (
    <>
      {/* Profile Menu Overlay */}
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setProfileMenuOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={() => setProfileMenuOpen(false)}
              className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            {user ? (
              <div className="px-4 pb-8 pt-2">
                {/* User info */}
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-lg overflow-hidden">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt="Profile"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      getInitials(user.firstName, user.lastName, user.email)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {getFullName(user.firstName, user.lastName) || "User"}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5 text-slate-500" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 text-slate-500" />
                    <span className="font-medium">Account Settings</span>
                  </Link>
                  {(user.role === "owner" || user.role === "admin") && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 text-purple-700 hover:bg-purple-50 rounded-xl"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Admin Panel</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 pb-8 pt-2">
                <p className="text-center text-slate-600 mb-4">Sign in to access your account</p>
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-700 text-white font-medium rounded-xl hover:bg-blue-800"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <LogIn className="h-5 w-5" />
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 flex-1"
              >
                <item.icon className={cn(
                  "h-6 w-6",
                  isActive ? "text-blue-700" : "text-slate-500"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-blue-700" : "text-slate-500"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Giving List */}
          <div className="flex-1 flex justify-center">
            <GivingListNavButton />
          </div>

          {/* Profile */}
          <button
            onClick={() => setProfileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1"
          >
            {user ? (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold overflow-hidden">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt="Profile"
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    getInitials(user.firstName, user.lastName, user.email)
                  )}
                </div>
                <span className="text-[10px] font-medium text-slate-500">Profile</span>
              </>
            ) : (
              <>
                <User className="h-6 w-6 text-slate-500" />
                <span className="text-[10px] font-medium text-slate-500">Account</span>
              </>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
