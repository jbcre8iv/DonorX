import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Paths that don't require beta access
const PUBLIC_PATHS = [
  "/invite",
  "/api/check-beta-access",
  "/login",
  "/register",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
];

// Create admin client for beta access check (bypasses RLS)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths without beta check
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // Continue with Supabase session update
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  // If not a public path, check beta access
  if (!isPublicPath) {
    // Check for beta access cookie (set after email verification)
    const hasBetaAccessCookie = request.cookies.get("beta_access")?.value === "granted";

    if (!hasBetaAccessCookie) {
      // If user is logged in, check if their email is in beta_testers
      if (user?.email) {
        try {
          const adminClient = getAdminClient();
          const { data: betaTester } = await adminClient
            .from("beta_testers")
            .select("id, is_active")
            .eq("email", user.email.toLowerCase())
            .eq("is_active", true)
            .single();

          if (betaTester) {
            // User has beta access, set cookie and continue
            supabaseResponse.cookies.set("beta_access", "granted", {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: "/",
            });
            return supabaseResponse;
          }
        } catch {
          // Error checking beta access, redirect to invite page
        }
      }

      // No beta access, redirect to invite page
      const inviteUrl = new URL("/invite", request.url);
      return NextResponse.redirect(inviteUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
