import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Header } from "./header";
import { SimulationModeBanner } from "@/components/layout/simulation-mode-banner";

async function getSimulationMode(): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("system_settings")
      .select("value")
      .eq("key", "simulation_mode")
      .single();

    if (error || !data) {
      return false;
    }

    return data.value?.enabled === true;
  } catch {
    return false;
  }
}

export async function HeaderWrapper() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userData: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    avatarUrl: string | null;
    simulationAccess: boolean;
  } | null = null;

  if (authUser) {
    let profile = null;

    // Try admin client first (bypasses RLS), fall back to regular client
    try {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from("users")
        .select("first_name, last_name, role, avatar_url, simulation_access")
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
        .select("first_name, last_name, role, avatar_url, simulation_access")
        .eq("id", authUser.id)
        .single();
      profile = data;
    }

    // Admin and Owner roles automatically have simulation access
    const isAdminOrOwner = profile?.role === "owner" || profile?.role === "admin";
    const hasSimulationAccess = isAdminOrOwner || profile?.simulation_access === true;

    userData = {
      email: authUser.email!,
      firstName: profile?.first_name || null,
      lastName: profile?.last_name || null,
      role: profile?.role || null,
      avatarUrl: profile?.avatar_url || null,
      simulationAccess: hasSimulationAccess,
    };
  }

  // Check simulation mode
  const simulationEnabled = await getSimulationMode();
  const isAdmin = userData?.role === "owner" || userData?.role === "admin";
  const canAccessSimulation = userData?.simulationAccess ?? false;

  return (
    <>
      <SimulationModeBanner enabled={simulationEnabled} isAdmin={isAdmin} />
      <Header
        initialUser={userData}
        simulationEnabled={simulationEnabled}
        canAccessSimulation={canAccessSimulation}
      />
    </>
  );
}
