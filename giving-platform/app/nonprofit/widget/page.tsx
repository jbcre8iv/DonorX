import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { WidgetClient } from "./widget-client";
import type { Nonprofit, WidgetToken } from "@/types/database";

export const metadata = {
  title: "Donation Widget - Nonprofit Portal",
};

export default async function NonprofitWidgetPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get nonprofit from user's nonprofit_users record
  const adminClient = createAdminClient();
  const { data: nonprofitUser } = await adminClient
    .from("nonprofit_users")
    .select(`
      role,
      nonprofit:nonprofits(*)
    `)
    .eq("user_id", user.id)
    .single();

  if (!nonprofitUser) {
    redirect("/nonprofit");
  }

  const nonprofit = nonprofitUser.nonprofit as unknown as Nonprofit;

  // Check for existing widget
  const { data: existingWidget } = await adminClient
    .from("widget_tokens")
    .select("*")
    .eq("nonprofit_id", nonprofit.id)
    .eq("is_active", true)
    .single();

  return (
    <WidgetClient
      nonprofit={nonprofit}
      initialWidget={existingWidget as WidgetToken | null}
    />
  );
}
