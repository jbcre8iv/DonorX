import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WidgetDonationForm } from "./widget-form";
import type { WidgetToken, Nonprofit } from "@/types/database";

interface WidgetPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: WidgetPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: widget } = await supabase
    .from("widget_tokens")
    .select(`
      name,
      nonprofit:nonprofits(name)
    `)
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (!widget) {
    return { title: "Widget Not Found" };
  }

  const nonprofit = widget.nonprofit as unknown as Nonprofit;

  return {
    title: `Donate to ${nonprofit?.name || "Nonprofit"}`,
  };
}

export default async function WidgetPage({ params }: WidgetPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch widget with nonprofit info
  const { data: widget, error } = await supabase
    .from("widget_tokens")
    .select(`
      *,
      nonprofit:nonprofits(id, name, logo_url, mission)
    `)
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (error || !widget) {
    notFound();
  }

  const typedWidget = widget as unknown as WidgetToken & { nonprofit: Nonprofit };

  return (
    <div
      className="min-h-screen p-4"
      style={{ backgroundColor: "transparent" }}
    >
      <WidgetDonationForm widget={typedWidget} />
    </div>
  );
}
