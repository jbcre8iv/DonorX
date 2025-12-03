import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS for beta access check
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ hasAccess: false });
    }

    const { data, error } = await supabaseAdmin
      .from("beta_testers")
      .select("id, is_active")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ hasAccess: false });
    }

    return NextResponse.json({ hasAccess: true });
  } catch {
    return NextResponse.json({ hasAccess: false });
  }
}
