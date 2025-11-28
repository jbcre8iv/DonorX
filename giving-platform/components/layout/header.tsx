"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, Settings, Shield, HandHeart } from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/(auth)/actions";
import { useCartFavorites } from "@/contexts/cart-favorites-context";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Directory" },
  { href: "/apply", label: "For Nonprofits" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// Giving List button component to avoid hook issues
function GivingListButton() {
  const { cartItems, setSidebarOpen } = useCartFavorites();

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      aria-label="Open giving list"
    >
      <HandHeart className="h-5 w-5" />
      {cartItems.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {cartItems.length > 9 ? "9+" : cartItems.length}
        </span>
      )}
    </button>
  );
}

// Mobile giving list button for the mobile menu
function MobileGivingListButton({ onClose }: { onClose: () => void }) {
  const { cartItems, setSidebarOpen } = useCartFavorites();

  return (
    <Button
      variant="outline"
      fullWidth
      onClick={() => {
        onClose();
        setSidebarOpen(true);
      }}
    >
      <HandHeart className="h-4 w-4 mr-2" />
      Giving List
      {cartItems.length > 0 && (
        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
          {cartItems.length}
        </span>
      )}
    </Button>
  );
}

interface HeaderProps {
  initialUser?: { email: string; firstName: string | null; lastName: string | null; role: string | null } | null;
}

export function Header({ initialUser = null }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [user, setUser] = React.useState<{ email: string; firstName: string | null; lastName: string | null; role: string | null } | null>(initialUser);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  // Helper to get full name from first and last name
  const getFullName = (firstName: string | null, lastName: string | null) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    return null;
  };

  // Helper to get initials
  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  // Sync user state when initialUser prop changes (for server-side updates)
  React.useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        // Only fetch if we don't already have user data with role from server
        // This prevents overwriting server-fetched data
        if (!initialUser?.role) {
          const { data: profile } = await supabase
            .from("users")
            .select("first_name, last_name, role")
            .eq("id", session.user.id)
            .single();

          if (isMounted) {
            setUser({
              email: session.user.email!,
              firstName: profile?.first_name || null,
              lastName: profile?.last_name || null,
              role: profile?.role || null,
            });
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initialUser?.role]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setUser(null); // Clear user immediately for instant UI feedback
    await logout();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur transition-shadow no-print",
        isScrolled && "shadow-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white font-bold text-sm">
            D
          </div>
          <span className="text-xl font-semibold text-slate-900">
            {config.appName}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive
                    ? "text-blue-700"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth Buttons / User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <GivingListButton />
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  {getInitials(user.firstName, user.lastName, user.email)}
                </div>
                <span className="max-w-[150px] truncate">{getFullName(user.firstName, user.lastName) || user.email}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900 truncate">{getFullName(user.firstName, user.lastName) || "User"}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </Link>
                  {(user.role === "owner" || user.role === "admin") && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden p-2 text-slate-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <nav className="flex flex-col px-4 py-4 space-y-3">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-base font-medium transition-colors py-2",
                    isActive
                      ? "text-blue-700"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
              {user ? (
                <>
                  <div className="flex items-center gap-3 pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                      {getInitials(user.firstName, user.lastName, user.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{getFullName(user.firstName, user.lastName) || "User"}</p>
                      <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <MobileGivingListButton onClose={() => setMobileMenuOpen(false)} />
                  <Button variant="outline" asChild fullWidth>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" asChild fullWidth>
                    <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)}>
                      Account Settings
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild fullWidth>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild fullWidth>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
