"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateAvatar(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("avatar") as File;

  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return { error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image." };
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { error: "File too large. Maximum size is 2MB." };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/avatar.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "Failed to upload image. Please try again." };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  // Add cache-busting query param
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  // Update user profile with avatar URL
  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) {
    console.error("Update error:", updateError);
    return { error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { success: true, avatarUrl };
}

export async function removeAvatar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get current avatar URL to find the file path
  const { data: profile } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url) {
    // Extract file path from URL and delete from storage
    const urlParts = profile.avatar_url.split("/avatars/");
    if (urlParts[1]) {
      const filePath = urlParts[1].split("?")[0]; // Remove query params
      await supabase.storage.from("avatars").remove([filePath]);
    }
  }

  // Clear avatar URL in profile
  const { error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to remove avatar. Please try again." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  const { error } = await supabase
    .from("users")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  // Verify current password by trying to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Current password is incorrect" };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
