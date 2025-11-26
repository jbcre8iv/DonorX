import { createClient } from "@/lib/supabase/server";
import { Header } from "./header";

export async function HeaderWrapper() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userData: { email: string; fullName: string | null } | null = null;

  if (authUser) {
    const { data: profile } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", authUser.id)
      .single();

    userData = {
      email: authUser.email!,
      fullName: profile?.full_name || null,
    };
  }

  return <Header initialUser={userData} />;
}
