import Link from "next/link";
import { CheckCircle, Download, Mail, ArrowRight, TestTube } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { config } from "@/lib/config";

export const metadata = {
  title: "Thank You for Your Donation",
};

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string; donation_id?: string; simulated?: string }>;
}

export default async function DonationSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id, donation_id, simulated } = await searchParams;
  const supabase = await createClient();
  const isSimulated = simulated === "true";

  let donation = null;
  let allocations: Array<{
    nonprofit_id: string | null;
    category_id: string | null;
    percentage: number;
    amount_cents: number;
    nonprofit: { name: string } | null;
    category: { name: string } | null;
  }> = [];

  // Handle simulated donations (direct donation_id)
  if (isSimulated && donation_id) {
    const { data: donationData } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donation_id)
      .single();

    donation = donationData;

    if (donation) {
      const { data: allocationData } = await supabase
        .from("allocations")
        .select(`
          nonprofit_id,
          category_id,
          percentage,
          amount_cents,
          nonprofit:nonprofits(name),
          category:categories(name)
        `)
        .eq("donation_id", donation.id);

      allocations = (allocationData || []).map((a: Record<string, unknown>) => ({
        nonprofit_id: a.nonprofit_id as string | null,
        category_id: a.category_id as string | null,
        percentage: a.percentage as number,
        amount_cents: a.amount_cents as number,
        nonprofit: Array.isArray(a.nonprofit) ? a.nonprofit[0] : a.nonprofit,
        category: Array.isArray(a.category) ? a.category[0] : a.category,
      }));
    }
  }
  // Handle real Stripe payments
  else if (session_id) {
    try {
      const stripe = getStripeServer();
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status === "paid" && session.metadata?.donation_id) {
        // Update donation status
        const { data: donationData } = await supabase
          .from("donations")
          .update({
            status: "completed",
            stripe_charge_id: session.payment_intent as string,
            completed_at: new Date().toISOString(),
          })
          .eq("id", session.metadata.donation_id)
          .select()
          .single();

        donation = donationData;

        // Fetch allocations with nonprofit/category names
        if (donation) {
          const { data: allocationData } = await supabase
            .from("allocations")
            .select(`
              nonprofit_id,
              category_id,
              percentage,
              amount_cents,
              nonprofit:nonprofits(name),
              category:categories(name)
            `)
            .eq("donation_id", donation.id);

          // Map the data - Supabase returns arrays for single relations
          allocations = (allocationData || []).map((a: Record<string, unknown>) => ({
            nonprofit_id: a.nonprofit_id as string | null,
            category_id: a.category_id as string | null,
            percentage: a.percentage as number,
            amount_cents: a.amount_cents as number,
            nonprofit: Array.isArray(a.nonprofit) ? a.nonprofit[0] : a.nonprofit,
            category: Array.isArray(a.category) ? a.category[0] : a.category,
          }));
        }
      }
    } catch (error) {
      console.error("Error retrieving session:", error);
    }
  }

  return (
    <div className="py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Simulation Mode Banner */}
          {isSimulated && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-center justify-center gap-2 text-amber-800">
                <TestTube className="h-5 w-5" />
                <span className="font-medium">Simulated Donation</span>
              </div>
              <p className="mt-1 text-sm text-amber-700">
                This is a test donation. No real payment was processed.
              </p>
            </div>
          )}

          {/* Success Icon */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isSimulated ? "bg-amber-100" : "bg-emerald-100"}`}>
            {isSimulated ? (
              <TestTube className="h-10 w-10 text-amber-600" />
            ) : (
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            )}
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isSimulated ? "Test Donation Complete!" : "Thank You for Your Generosity!"}
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            {isSimulated
              ? "Your simulated donation has been recorded for testing purposes."
              : "Your donation has been successfully processed."
            }
          </p>

          {/* Donation Details Card */}
          {donation && (
            <Card className="mb-8 text-left">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-slate-600">Total Donation</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {formatCurrency(donation.amount_cents)}
                    </span>
                  </div>

                  {allocations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">
                        Your Impact
                      </h3>
                      <div className="space-y-2">
                        {allocations.map((allocation, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50"
                          >
                            <span className="text-slate-700">
                              {allocation.nonprofit?.name ||
                                allocation.category?.name ||
                                "Unknown"}
                            </span>
                            <span className="font-medium text-slate-900">
                              {formatCurrency(allocation.amount_cents)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      Donation ID: {donation.id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-slate-500">
                      Date: {new Date(donation.completed_at || donation.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* What's Next */}
          <Card className="mb-8 text-left">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">What&apos;s Next?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Confirmation Email</p>
                    <p className="text-sm text-slate-600">
                      You&apos;ll receive an email confirmation shortly with your donation details.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Download className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Tax Receipt</p>
                    <p className="text-sm text-slate-600">
                      Your single tax receipt will be available in your dashboard and sent via email.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/directory">
                Explore More Nonprofits
              </Link>
            </Button>
          </div>

          {/* Social Share */}
          <p className="mt-8 text-sm text-slate-500">
            Your generosity inspires others.{" "}
            <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
              Share your impact
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
