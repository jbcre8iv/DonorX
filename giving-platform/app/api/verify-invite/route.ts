import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Valid invite codes - you can add multiple codes here
// In production, you might want to store these in a database
const VALID_INVITE_CODES = [
  process.env.INVITE_CODE || "BETA2024",
  "DONORX2024",
  "EARLYACCESS",
].map((code) => code.toUpperCase());

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "No code provided" }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    if (VALID_INVITE_CODES.includes(normalizedCode)) {
      // Set a cookie that lasts 30 days
      const cookieStore = await cookies();
      cookieStore.set("invite_access", "granted", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid code" }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
