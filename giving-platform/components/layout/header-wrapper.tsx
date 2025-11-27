import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Header } from "./header";

export async function HeaderWrapper() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userData: { email: string; firstName: string | null; lastName: string | null; role: string | null } | null = null;

  if (authUser) {
    let profile = null;

    // Try admin client first (bypasses RLS), fall back to regular client
    try {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from("users")
        .select("first_name, last_name, role")
        .eq("id", authUser.id)
        .single();
      if (error) {
        console.error("[HeaderWrapper] Admin client error:", error.message);
      }
      profile = data;
    } catch (e) {
      console.log("[HeaderWrapper] Admin client not available, falling back");
      // Admin client not available, try regular client
      const { data } = await supabase
        .from("users")
        .select("first_name, last_name, role")
        .eq("id", authUser.id)
        .single();
      profile = data;
    }

    userData = {
      email: authUser.email!,
      firstName: profile?.first_name || null,
      lastName: profile?.last_name || null,
      role: profile?.role || null,
    };
  }

  return <Header initialUser={userData} />;
}
