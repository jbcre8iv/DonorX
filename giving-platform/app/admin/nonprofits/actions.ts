"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveNonprofit(nonprofitId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("nonprofits")
    .update({ status: "approved" })
    .eq("id", nonprofitId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true };
}

export async function rejectNonprofit(nonprofitId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("nonprofits")
    .update({ status: "rejected" })
    .eq("id", nonprofitId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleFeatured(nonprofitId: string, featured: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("nonprofits")
    .update({ is_featured: featured })
    .eq("id", nonprofitId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/directory");
  return { success: true };
}

export async function deleteNonprofit(nonprofitId: string) {
  const supabase = await createClient();

  // First check if there are any allocations to this nonprofit
  const { data: allocations } = await supabase
    .from("allocations")
    .select("id")
    .eq("nonprofit_id", nonprofitId)
    .limit(1);

  if (allocations && allocations.length > 0) {
    return { error: "Cannot delete nonprofit with existing donations" };
  }

  const { error } = await supabase
    .from("nonprofits")
    .delete()
    .eq("id", nonprofitId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true };
}

export async function createNonprofit(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const ein = formData.get("ein") as string;
  const description = formData.get("description") as string;
  const mission = formData.get("mission") as string;
  const website = formData.get("website") as string;
  const categoryId = formData.get("category_id") as string;
  const logoUrl = formData.get("logo_url") as string;

  if (!name || !ein) {
    return { error: "Name and EIN are required" };
  }

  const { error } = await supabase.from("nonprofits").insert({
    name,
    ein,
    description: description || null,
    mission: mission || null,
    website: website || null,
    category_id: categoryId || null,
    logo_url: logoUrl || null,
    status: "approved", // Admin-added nonprofits are auto-approved
    is_featured: false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true };
}

export async function updateNonprofit(nonprofitId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const ein = formData.get("ein") as string;
  const description = formData.get("description") as string;
  const mission = formData.get("mission") as string;
  const website = formData.get("website") as string;
  const categoryId = formData.get("category_id") as string;
  const logoUrl = formData.get("logo_url") as string;

  if (!name || !ein) {
    return { error: "Name and EIN are required" };
  }

  const { error } = await supabase
    .from("nonprofits")
    .update({
      name,
      ein,
      description: description || null,
      mission: mission || null,
      website: website || null,
      category_id: categoryId || null,
      logo_url: logoUrl || null,
    })
    .eq("id", nonprofitId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/nonprofits");
  revalidatePath("/directory");
  revalidatePath(`/directory/${nonprofitId}`);
  return { success: true };
}
