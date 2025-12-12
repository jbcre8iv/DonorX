import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get nonprofit from user's nonprofit_users record
  const { data: nonprofitUser, error } = await supabase
    .from("nonprofit_users")
    .select("nonprofit_id, role")
    .eq("user_id", user.id)
    .single();

  if (error || !nonprofitUser) {
    return NextResponse.json(
      { error: "No nonprofit association found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    nonprofitId: nonprofitUser.nonprofit_id,
    role: nonprofitUser.role,
  });
}
