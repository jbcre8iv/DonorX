import { createClient, createAdminClient } from "@/lib/supabase/server";

export type UserRole = "owner" | "admin" | "member" | "viewer";

export interface CurrentUser {
  id: string;
  role: UserRole;
}

/**
 * Get the current authenticated user and their role
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  // Try to get role using admin client first (bypasses RLS)
  let role: UserRole = "member";
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single();
    role = (data?.role as UserRole) || "member";
  } catch {
    // Fallback to regular client
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single();
    role = (data?.role as UserRole) || "member";
  }

  return {
    id: authUser.id,
    role,
  };
}

/**
 * Check if user has owner role
 */
export async function requireOwner(): Promise<
  { user: CurrentUser } | { error: string }
> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (user.role !== "owner") {
    return { error: "Only owners can perform this action" };
  }

  return { user };
}

/**
 * Check if user has admin or owner role
 */
export async function requireAdmin(): Promise<
  { user: CurrentUser } | { error: string }
> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (user.role !== "owner" && user.role !== "admin") {
    return { error: "Admin access required" };
  }

  return { user };
}
