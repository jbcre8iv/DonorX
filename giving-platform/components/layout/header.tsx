"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, Settings, Shield, HandHeart, ChevronDown, TestTube, Loader2 } from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/(auth)/actions";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { toggleSimulationMode } from "@/app/admin/settings/actions";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Directory" },
  { href: "/apply", label: "For Nonprofits" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// Giving List button component to avoid hook issues
function GivingListButton() {
  const { cartItems, isSidebarOpen, setSidebarOpen, hasDraft } = useCartFavorites();
  const [isAnimating, setIsAnimating] = React.useState(false);
  const prevCountRef = React.useRef(cartItems.length);

  // Detect when items are added and trigger animation
  React.useEffect(() => {
    if (cartItems.length > prevCountRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartItems.length;
  }, [cartItems.length]);

  return (
    <button
      onClick={() => setSidebarOpen(!isSidebarOpen)}
      data-giving-list-button
      className={cn(
        "relative rounded-lg p-2 md:p-2.5 transition-colors",
        hasDraft
          ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        isAnimating && "animate-bounce-subtle"
      )}
      aria-label="Open giving list"
    >
      <HandHeart className={cn("h-6 w-6 md:h-7 md:w-7", isAnimating && !hasDraft && "text-blue-600")} />
      {/* Active donation indicator - pulsing green dot */}
      {hasDraft && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
        </span>
      )}
      {/* Cart count badge - only show when no draft */}
      {!hasDraft && cartItems.length > 0 && (
        <span className={cn(
          "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white transition-transform",
          isAnimating && "scale-125"
        )}>
          {cartItems.length > 9 ? "9+" : cartItems.length}
        </span>
      )}
    </button>
  );
}


interface HeaderProps {
  initialUser?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    avatarUrl: string | null;
    simulationAccess?: boolean;
  } | null;
  simulationEnabled?: boolean;
  canAccessSimulation?: boolean;
}

export function Header({ initialUser = null, simulationEnabled = false, canAccessSimulation = false }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [user, setUser] = React.useState<{
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    avatarUrl: string | null;
    simulationAccess?: boolean;
  } | null>(initialUser);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = React.useState(false);
  const [isSimulationEnabled, setIsSimulationEnabled] = React.useState(simulationEnabled);
  const [isTogglingSimulation, setIsTogglingSimulation] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Sync simulation state from props
  React.useEffect(() => {
    setIsSimulationEnabled(simulationEnabled);
  }, [simulationEnabled]);

  // Track simulation access state locally for realtime updates
  const [hasSimulationAccess, setHasSimulationAccess] = React.useState(canAccessSimulation);

  // Sync simulation access from props
  React.useEffect(() => {
    setHasSimulationAccess(canAccessSimulation);
  }, [canAccessSimulation]);

  // Subscribe to realtime changes for simulation access/enabled
  React.useEffect(() => {
    if (!initialUser) return;

    const supabase = createClient();

    // Get the current user's ID to subscribe to their record
    const setupSubscription = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Subscribe to changes on the current user's record
      const channel = supabase
        .channel(`user-simulation-${authUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${authUser.id}`,
          },
          (payload) => {
            const newData = payload.new as {
              simulation_access?: boolean;
              simulation_enabled?: boolean;
              role?: string;
            };

            // Check if user still has simulation access
            const isAdminOrOwner = newData.role === 'owner' || newData.role === 'admin';
            const newHasAccess = isAdminOrOwner || newData.simulation_access === true;
            const newEnabled = newData.simulation_enabled === true;

            // Update states based on new data
            setHasSimulationAccess(newHasAccess);

            // If access was revoked, also turn off simulation
            if (!newHasAccess) {
              setIsSimulationEnabled(false);
            } else {
              setIsSimulationEnabled(newEnabled);
            }

            // Refresh the page to update server components (like the banner)
            router.refresh();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then((unsubscribe) => unsubscribe?.());
    };
  }, [initialUser, router]);

  const handleToggleSimulation = async () => {
    setIsTogglingSimulation(true);
    try {
      const result = await toggleSimulationMode();
      if (result.success) {
        setIsSimulationEnabled(result.enabled);
        router.refresh();
      }
    } finally {
      setIsTogglingSimulation(false);
    }
  };

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

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

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
            .select("first_name, last_name, role, avatar_url")
            .eq("id", session.user.id)
            .single();

          if (isMounted) {
            setUser({
              email: session.user.email!,
              firstName: profile?.first_name || null,
              lastName: profile?.last_name || null,
              role: profile?.role || null,
              avatarUrl: profile?.avatar_url || null,
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
    <>
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur transition-shadow no-print",
        isScrolled && "shadow-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-semibold text-slate-900">
            {config.appName}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
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
                  "text-sm font-medium transition-colors whitespace-nowrap",
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
        <div className="hidden lg:flex items-center gap-3 xl:gap-4">
          <GivingListButton />
          {user ? (
            <>
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-slate-200 transition-all"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold overflow-hidden">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt="Profile"
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    getInitials(user.firstName, user.lastName, user.email)
                  )}
                </div>
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
                      className="flex items-center gap-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                  {/* Simulation Mode Toggle - visible to users with simulation access */}
                  {hasSimulationAccess && (
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleToggleSimulation}
                        disabled={isTogglingSimulation}
                        className={cn(
                          "flex w-full items-center justify-between px-4 py-2 text-sm transition-colors",
                          isSimulationEnabled
                            ? "text-amber-700 hover:bg-amber-50"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isTogglingSimulation ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          <span>Simulation Mode</span>
                        </div>
                        <div className={cn(
                          "relative w-9 h-5 rounded-full transition-colors",
                          isSimulationEnabled ? "bg-amber-500" : "bg-slate-300"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                            isSimulationEnabled ? "translate-x-4" : "translate-x-0.5"
                          )} />
                        </div>
                      </button>
                      {isSimulationEnabled && (
                        <p className="px-4 pb-2 text-xs text-amber-600">
                          Donations won&apos;t process real payments
                        </p>
                      )}
                    </div>
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

        {/* Mobile/Tablet: Giving List + Hamburger Menu Button */}
        <div className="lg:hidden flex items-center gap-1">
          <GivingListButton />
          <button
            type="button"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

    </header>

      {/* Mobile/Tablet Menu Overlay - outside header so it covers page content */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile/Tablet Menu - fixed position below header */}
      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-50 lg:hidden border-t border-slate-200 bg-white shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4">
            {/* User section at top */}
            <div className="pb-4 border-b border-slate-200">
              {user ? (
                <div>
                  {/* Collapsible user menu trigger */}
                  <button
                    onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                    className="flex items-center justify-between w-full py-2 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold overflow-hidden">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          getInitials(user.firstName, user.lastName, user.email)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{getFullName(user.firstName, user.lastName) || "User"}</p>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-5 w-5 text-slate-400 transition-transform",
                      mobileUserMenuOpen && "rotate-180"
                    )} />
                  </button>
                  {/* Dropdown menu items */}
                  {mobileUserMenuOpen && (
                    <div className="mt-2 ml-2 pl-4 border-l-2 border-slate-200 space-y-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 py-2 px-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-slate-500" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 py-2 px-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-slate-500" />
                        Account Settings
                      </Link>
                      {(user.role === "owner" || user.role === "admin") && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 py-2 px-2 text-purple-700 hover:bg-purple-50 rounded-lg"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      {/* Simulation Mode Toggle for mobile */}
                      {hasSimulationAccess && (
                        <div className="pt-2 mt-2 border-t border-slate-200">
                          <button
                            onClick={handleToggleSimulation}
                            disabled={isTogglingSimulation}
                            className={cn(
                              "flex w-full items-center justify-between py-2 px-2 rounded-lg transition-colors",
                              isSimulationEnabled
                                ? "text-amber-700 hover:bg-amber-50"
                                : "text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {isTogglingSimulation ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                              <span>Simulation Mode</span>
                            </div>
                            <div className={cn(
                              "relative w-9 h-5 rounded-full transition-colors",
                              isSimulationEnabled ? "bg-amber-500" : "bg-slate-300"
                            )}>
                              <div className={cn(
                                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                                isSimulationEnabled ? "translate-x-4" : "translate-x-0.5"
                              )} />
                            </div>
                          </button>
                          {isSimulationEnabled && (
                            <p className="px-2 pb-1 text-xs text-amber-600">
                              Donations won&apos;t process real payments
                            </p>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 py-2 px-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
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
                </div>
              )}
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col pt-4 space-y-3">
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
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
