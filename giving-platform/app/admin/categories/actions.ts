"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/permissions";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  const { error } = await supabase.from("categories").insert({
    name,
    description: description || null,
    icon: icon || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/directory");
  revalidatePath("/donate");
  return { success: true };
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      description: description || null,
      icon: icon || null,
    })
    .eq("id", categoryId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/directory");
  revalidatePath("/donate");
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  // Only owners can delete categories
  const ownerCheck = await requireOwner();
  if ("error" in ownerCheck) {
    return { error: ownerCheck.error };
  }

  const supabase = await createClient();

  // Check if there are any nonprofits in this category
  const { data: nonprofits } = await supabase
    .from("nonprofits")
    .select("id")
    .eq("category_id", categoryId)
    .limit(1);

  if (nonprofits && nonprofits.length > 0) {
    return { error: "Cannot delete category with existing nonprofits" };
  }

  // Check if there are any allocations to this category
  const { data: allocations } = await supabase
    .from("allocations")
    .select("id")
    .eq("category_id", categoryId)
    .limit(1);

  if (allocations && allocations.length > 0) {
    return { error: "Cannot delete category with existing donations" };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/directory");
  return { success: true };
}
