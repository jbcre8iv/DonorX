"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const rememberMe = formData.get("rememberMe") === "on";
  const supabase = await createClient({ persistSession: rememberMe });

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const redirectTo = formData.get("redirect") as string | null;

  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");

  // Redirect to the specified URL or default to dashboard
  // Only allow internal redirects (starting with /)
  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }
  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const organizationName = formData.get("organizationName") as string;
  const organizationType = formData.get("organizationType") as string;
  const fullName = `${firstName} ${lastName}`.trim();

  // First, sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Use admin client to bypass RLS for initial setup
    const adminClient = createAdminClient();

    // Create the organization
    const { data: orgData, error: orgError } = await adminClient
      .from("organizations")
      .insert({
        name: organizationName,
        type: organizationType,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", JSON.stringify(orgError, null, 2));
      return { error: `Failed to create organization: ${orgError.message}` };
    }

    // Create the user profile
    // All users are auto-approved for public donation platform
    // Note: avatar_url can be set later via profile settings
    const { error: userError } = await adminClient.from("users").insert({
      id: authData.user.id,
      email: email,
      first_name: firstName,
      last_name: lastName,
      organization_id: orgData.id,
      role: "member",
      status: "approved",
      approved_at: new Date().toISOString(),
    });

    if (userError) {
      console.error("Error creating user profile:", JSON.stringify(userError, null, 2));
      return { error: `Failed to create user profile: ${userError.message}` };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for a password reset link." };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
