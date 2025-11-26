"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/client";
import { config } from "@/lib/config";
import type { RecurringInterval } from "@/types/database";

export interface AllocationInput {
  type: "nonprofit" | "category";
  targetId: string;
  targetName: string;
  percentage: number;
}

export interface CreateCheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

export type DonationFrequency = "one-time" | RecurringInterval;

export async function createCheckoutSession(
  amountCents: number,
  allocations: AllocationInput[],
  frequency: DonationFrequency = "one-time"
): Promise<CreateCheckoutResult> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to donate" };
  }

  // Validate amount
  if (amountCents < config.features.minDonationCents) {
    return {
      success: false,
      error: `Minimum donation is $${config.features.minDonationCents / 100}`,
    };
  }

  // Validate allocations
  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (totalPercentage !== 100) {
    return { success: false, error: "Allocations must total 100%" };
  }

  if (allocations.length === 0) {
    return { success: false, error: "At least one allocation is required" };
  }

  if (allocations.length > config.features.maxAllocationItems) {
    return {
      success: false,
      error: `Maximum ${config.features.maxAllocationItems} allocations allowed`,
    };
  }

  try {
    const stripe = getStripeServer();

    // Get user's organization_id if they have one
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const isRecurring = frequency !== "one-time";
    const recurringInterval = isRecurring ? frequency as RecurringInterval : null;

    // Create pending donation record
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        user_id: user.id,
        organization_id: userData?.organization_id || null,
        amount_cents: amountCents,
        status: "pending",
        is_recurring: isRecurring,
        recurring_interval: recurringInterval,
      })
      .select()
      .single();

    if (donationError || !donation) {
      console.error("Failed to create donation:", donationError);
      return { success: false, error: "Failed to create donation record" };
    }

    // Create allocation records
    const allocationRecords = allocations.map((a) => ({
      donation_id: donation.id,
      nonprofit_id: a.type === "nonprofit" ? a.targetId : null,
      category_id: a.type === "category" ? a.targetId : null,
      percentage: a.percentage,
      amount_cents: Math.round((amountCents * a.percentage) / 100),
      disbursed: false,
    }));

    const { error: allocError } = await supabase
      .from("allocations")
      .insert(allocationRecords);

    if (allocError) {
      console.error("Failed to create allocations:", allocError);
      // Clean up the donation
      await supabase.from("donations").delete().eq("id", donation.id);
      return { success: false, error: "Failed to create allocation records" };
    }

    // Build line item description
    const allocationSummary = allocations
      .map((a) => `${a.targetName} (${a.percentage}%)`)
      .join(", ");

    // Map frequency to Stripe interval
    const stripeIntervalMap: Record<RecurringInterval, { interval: "month" | "year"; interval_count: number }> = {
      monthly: { interval: "month", interval_count: 1 },
      quarterly: { interval: "month", interval_count: 3 },
      annually: { interval: "year", interval_count: 1 },
    };

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (isRecurring && recurringInterval) {
      // Create subscription checkout
      const { interval, interval_count } = stripeIntervalMap[recurringInterval];

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Recurring Charitable Donation",
                description: `${frequency} donation - Allocation: ${allocationSummary}`,
              },
              unit_amount: amountCents,
              recurring: {
                interval,
                interval_count,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          donation_id: donation.id,
          user_id: user.id,
          frequency,
          allocations: JSON.stringify(allocations),
        },
        subscription_data: {
          metadata: {
            donation_id: donation.id,
            user_id: user.id,
            frequency,
          },
        },
        success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/donate?canceled=true`,
      });

      // Update donation with Stripe session ID
      await supabase
        .from("donations")
        .update({ stripe_payment_intent_id: session.id })
        .eq("id", donation.id);

      return { success: true, url: session.url || undefined };
    } else {
      // Create one-time payment checkout
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Charitable Donation",
                description: `Allocation: ${allocationSummary}`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          donation_id: donation.id,
          user_id: user.id,
        },
        success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/donate?canceled=true`,
      });

      // Update donation with Stripe session ID
      await supabase
        .from("donations")
        .update({ stripe_payment_intent_id: session.id })
        .eq("id", donation.id);

      return { success: true, url: session.url || undefined };
    }
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}
