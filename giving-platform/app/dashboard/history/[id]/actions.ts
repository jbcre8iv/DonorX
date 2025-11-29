"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markDonationComplete(donationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the donation belongs to this user and is simulated
  const { data: donation } = await supabase
    .from("donations")
    .select("id, user_id, is_simulated, status")
    .eq("id", donationId)
    .eq("user_id", user.id)
    .single();

  if (!donation) {
    return { success: false, error: "Donation not found" };
  }

  if (!donation.is_simulated) {
    return { success: false, error: "Only simulated donations can be manually completed" };
  }

  if (donation.status === "completed") {
    return { success: false, error: "Donation is already completed" };
  }

  // Update the donation status
  const { error } = await supabase
    .from("donations")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", donationId);

  if (error) {
    console.error("Error marking donation complete:", error);
    return { success: false, error: "Failed to update donation" };
  }

  revalidatePath(`/dashboard/history/${donationId}`);
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/receipts");

  return { success: true };
}
