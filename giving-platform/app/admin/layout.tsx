import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is an approved team member
  let userData = null;
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("users")
      .select("status, role")
      .eq("id", user.id)
      .single();
    userData = data;
  } catch {
    // Fallback to regular client
    const { data } = await supabase
      .from("users")
      .select("status, role")
      .eq("id", user.id)
      .single();
    userData = data;
  }

  // Only team members (owner, admin, member, viewer) can access admin panel
  const validRoles = ["owner", "admin", "member", "viewer"];
  if (!userData || !userData.role || !validRoles.includes(userData.role)) {
    redirect("/dashboard");
  }

  // Owners always have access (they need to approve users)
  // Other roles need to be approved
  if (userData.role !== "owner" && userData.status !== "approved") {
    redirect("/pending-approval");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar variant="admin" />
      <div className="flex-1 overflow-auto bg-purple-50/30">
        {/* Admin header bar - desktop only */}
        <div className="hidden md:flex items-center justify-between px-8 py-3 bg-purple-100/50 border-b border-purple-200">
          <div className="flex items-center gap-2 text-purple-700">
            <span className="text-sm font-medium">Platform Administration</span>
          </div>
          <span className="text-xs text-purple-600">
            Changes here affect the entire DonorX platform
          </span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
