import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      widgetToken,
      nonprofitId,
      amountCents,
      coverFees,
      feeAmountCents,
      isAnonymous,
    } = body;

    if (!widgetToken || !nonprofitId || !amountCents) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify widget token is valid
    const { data: widget, error: widgetError } = await supabase
      .from("widget_tokens")
      .select("id, nonprofit_id, min_amount_cents")
      .eq("token", widgetToken)
      .eq("is_active", true)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json(
        { error: "Invalid widget token" },
        { status: 400 }
      );
    }

    // Verify nonprofit matches
    if (widget.nonprofit_id !== nonprofitId) {
      return NextResponse.json(
        { error: "Nonprofit mismatch" },
        { status: 400 }
      );
    }

    // Verify minimum amount
    if (amountCents < widget.min_amount_cents) {
      return NextResponse.json(
        { error: `Minimum donation is $${widget.min_amount_cents / 100}` },
        { status: 400 }
      );
    }

    // Get nonprofit info
    const { data: nonprofit } = await supabase
      .from("nonprofits")
      .select("id, name")
      .eq("id", nonprofitId)
      .eq("status", "approved")
      .single();

    if (!nonprofit) {
      return NextResponse.json(
        { error: "Nonprofit not found" },
        { status: 404 }
      );
    }

    const totalAmountCents = amountCents + (coverFees ? feeAmountCents : 0);

    // Create donation record
    const { data: donation, error: donationError } = await adminSupabase
      .from("donations")
      .insert({
        amount_cents: amountCents,
        cover_fees: coverFees || false,
        fee_amount_cents: coverFees ? feeAmountCents : 0,
        is_anonymous: isAnonymous || false,
        status: "pending",
        notes: JSON.stringify({ widget_token_id: widget.id }),
      })
      .select("id")
      .single();

    if (donationError || !donation) {
      console.error("Failed to create donation:", donationError);
      return NextResponse.json(
        { error: "Failed to create donation" },
        { status: 500 }
      );
    }

    // Create allocation
    await adminSupabase.from("allocations").insert({
      donation_id: donation.id,
      nonprofit_id: nonprofitId,
      percentage: 100,
      amount_cents: amountCents,
    });

    // Create Stripe Checkout session
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    const stripe = getStripeServer();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Donation to ${nonprofit.name}`,
              description: coverFees
                ? `$${(amountCents / 100).toFixed(2)} donation + $${(feeAmountCents / 100).toFixed(2)} processing fee`
                : `One-time donation`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/widget/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/widget/${widgetToken}`,
      metadata: {
        donation_id: donation.id,
        nonprofit_id: nonprofitId,
        widget_token_id: widget.id,
        is_widget_donation: "true",
      },
    });

    // Update donation with Stripe session ID
    await adminSupabase
      .from("donations")
      .update({ stripe_payment_intent_id: session.id })
      .eq("id", donation.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Widget checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
