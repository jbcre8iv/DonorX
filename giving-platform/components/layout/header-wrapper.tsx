import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Header } from "./header";
import { SimulationModeBanner } from "@/components/layout/simulation-mode-banner";

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
    simulationEnabled: boolean;
  } | null = null;

  if (authUser) {
    let profile: {
      first_name: string | null;
      last_name: string | null;
      role: string | null;
      avatar_url: string | null;
      simulation_access?: boolean | null;
      simulation_enabled?: boolean | null;
    } | null = null;

    // Try admin client first (bypasses RLS), fall back to regular client
    try {
      const adminClient = createAdminClient();
      // First try with simulation columns
      const { data, error } = await adminClient
        .from("users")
        .select("first_name, last_name, role, avatar_url, simulation_access, simulation_enabled")
        .eq("id", authUser.id)
        .single();

      if (error) {
        // If error mentions simulation columns, try without them
        if (error.message.includes("simulation")) {
          console.log("[HeaderWrapper] simulation columns not found, fetching without them");
          const { data: fallbackData } = await adminClient
            .from("users")
            .select("first_name, last_name, role, avatar_url")
            .eq("id", authUser.id)
            .single();
          profile = fallbackData ? { ...fallbackData, simulation_access: null, simulation_enabled: null } : null;
        } else {
          console.error("[HeaderWrapper] Admin client error:", error.message);
        }
      } else {
        profile = data;
      }
    } catch (e) {
      console.log("[HeaderWrapper] Admin client not available, falling back");
      // Admin client not available, try regular client
      const { data } = await supabase
        .from("users")
        .select("first_name, last_name, role, avatar_url")
        .eq("id", authUser.id)
        .single();
      profile = data ? { ...data, simulation_access: null, simulation_enabled: null } : null;
    }

    // Admin and Owner roles automatically have simulation access
    const isAdminOrOwner = profile?.role === "owner" || profile?.role === "admin";
    const hasSimulationAccess = isAdminOrOwner || profile?.simulation_access === true;
    // User's personal simulation on/off state
    const simulationEnabled = profile?.simulation_enabled === true;

    userData = {
      email: authUser.email!,
      firstName: profile?.first_name || null,
      lastName: profile?.last_name || null,
      role: profile?.role || null,
      avatarUrl: profile?.avatar_url || null,
      simulationAccess: hasSimulationAccess,
      simulationEnabled: simulationEnabled,
    };
  }

  // User's simulation state
  const isAdmin = userData?.role === "owner" || userData?.role === "admin";
  const canAccessSimulation = userData?.simulationAccess ?? false;
  const userSimulationEnabled = userData?.simulationEnabled ?? false;

  return (
    <>
      <SimulationModeBanner enabled={userSimulationEnabled} isAdmin={isAdmin} />
      <Header
        initialUser={userData}
        simulationEnabled={userSimulationEnabled}
        canAccessSimulation={canAccessSimulation}
      />
    </>
  );
}
