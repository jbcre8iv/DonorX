import { createClient } from "@/lib/supabase/server";
import { Header } from "./header";

export async function HeaderWrapper() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userData: { email: string; firstName: string | null; lastName: string | null; avatarUrl: string | null } | null = null;

  if (authUser) {
    const { data: profile } = await supabase
      .from("users")
      .select("first_name, last_name, avatar_url")
      .eq("id", authUser.id)
      .single();

    userData = {
      email: authUser.email!,
      firstName: profile?.first_name || null,
      lastName: profile?.last_name || null,
      avatarUrl: profile?.avatar_url || null,
    };
  }

  return <Header initialUser={userData} />;
}
