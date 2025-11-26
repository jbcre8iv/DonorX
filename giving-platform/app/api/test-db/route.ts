import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test categories
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("*");

    // Test nonprofits
    const { data: nonprofits, error: npError } = await supabase
      .from("nonprofits")
      .select("*");

    return NextResponse.json({
      success: true,
      categories: {
        count: categories?.length || 0,
        error: catError?.message || null,
        data: categories,
      },
      nonprofits: {
        count: nonprofits?.length || 0,
        error: npError?.message || null,
        data: nonprofits,
      },
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET",
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
