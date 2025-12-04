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
    // If user is logged in, always verify beta access against database
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
          // User has active beta access, continue
          return supabaseResponse;
        } else {
          // User's access was revoked - sign them out and redirect
          await supabase.auth.signOut();

          // Clear all auth-related cookies
          const response = NextResponse.redirect(new URL("/invite", request.url));
          response.cookies.set("beta_access", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/",
          });
          // Clear Supabase auth cookies
          request.cookies.getAll().forEach((cookie) => {
            if (cookie.name.includes("supabase") || cookie.name.includes("sb-")) {
              response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
            }
          });
          return response;
        }
      } catch {
        // No beta access found, redirect to invite page
        const inviteUrl = new URL("/invite", request.url);
        return NextResponse.redirect(inviteUrl);
      }
    }

    // User not logged in - check for beta access cookie (from invite page verification)
    const hasBetaAccessCookie = request.cookies.get("beta_access")?.value === "granted";
    if (!hasBetaAccessCookie) {
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
