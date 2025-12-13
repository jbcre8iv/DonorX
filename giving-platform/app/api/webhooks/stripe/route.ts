import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeServer } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  try {
    const stripe = getStripeServer();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Use admin client to bypass RLS - webhooks run without user context
    const adminClient = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const donationId = session.metadata?.donation_id;
        const campaignId = session.metadata?.campaign_id;
        const fundraiserId = session.metadata?.fundraiser_id;
        const isAnonymous = session.metadata?.is_anonymous === "true";
        const userId = session.metadata?.user_id;

        if (donationId && session.payment_status === "paid") {
          // Update donation status to completed
          const { error: updateError } = await adminClient
            .from("donations")
            .update({
              status: "completed",
              stripe_charge_id: session.payment_intent as string,
              completed_at: new Date().toISOString(),
            })
            .eq("id", donationId);

          if (updateError) {
            console.error(`Failed to update donation ${donationId}:`, updateError);
          } else {
            console.log(`Donation ${donationId} marked as completed`);
          }

          // Create campaign_donation record if this was a campaign donation
          if (campaignId && userId) {
            try {
              const adminClient = createAdminClient();

              // Get user name for donor display
              const { data: userProfile } = await adminClient
                .from("users")
                .select("full_name, email")
                .eq("id", userId)
                .single();

              const displayName = isAnonymous
                ? null
                : (userProfile?.full_name || userProfile?.email?.split("@")[0] || "Anonymous");

              const { error: campaignDonationError } = await adminClient
                .from("campaign_donations")
                .insert({
                  campaign_id: campaignId,
                  donation_id: donationId,
                  fundraiser_id: fundraiserId || null,
                  donor_display_name: displayName,
                  is_anonymous: isAnonymous,
                });

              if (campaignDonationError) {
                console.error("Failed to create campaign donation record:", campaignDonationError);
              } else {
                console.log(`Campaign donation record created for campaign ${campaignId}`);
              }
            } catch (err) {
              console.error("Error creating campaign donation:", err);
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const donationId = session.metadata?.donation_id;

        if (donationId) {
          // Mark donation as failed
          await adminClient
            .from("donations")
            .update({ status: "failed" })
            .eq("id", donationId);

          console.log(`Donation ${donationId} marked as failed (session expired)`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        // Find donation by stripe_charge_id
        const { data: donation } = await adminClient
          .from("donations")
          .select("id")
          .eq("stripe_charge_id", charge.id)
          .single();

        if (donation) {
          await adminClient
            .from("donations")
            .update({ status: "refunded" })
            .eq("id", donation.id);

          console.log(`Donation ${donation.id} marked as refunded`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
