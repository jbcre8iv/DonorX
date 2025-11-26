import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeServer } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
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

    const supabase = await createClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const donationId = session.metadata?.donation_id;

        if (donationId && session.payment_status === "paid") {
          // Update donation status to completed
          await supabase
            .from("donations")
            .update({
              status: "completed",
              stripe_charge_id: session.payment_intent as string,
              completed_at: new Date().toISOString(),
            })
            .eq("id", donationId);

          console.log(`Donation ${donationId} marked as completed`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const donationId = session.metadata?.donation_id;

        if (donationId) {
          // Mark donation as failed
          await supabase
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
        const { data: donation } = await supabase
          .from("donations")
          .select("id")
          .eq("stripe_charge_id", charge.id)
          .single();

        if (donation) {
          await supabase
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
