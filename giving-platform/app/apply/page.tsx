import { createClient } from "@/lib/supabase/server";
import { ApplicationForm } from "./application-form";

export const metadata = {
  title: "Apply to Join | DonorX",
  description: "Apply to have your nonprofit organization listed in the DonorX directory",
};

export default async function ApplyPage() {
  const supabase = await createClient();

  // Fetch categories for the form
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            List Your Nonprofit
          </h1>
          <p className="mt-2 text-slate-600">
            Join our directory and connect with donors who want to support your mission.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <ApplicationForm categories={categories || []} />
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Applications are reviewed by our team within 2-3 business days.
            You&apos;ll receive an email once your application has been processed.
          </p>
        </div>
      </div>
    </div>
  );
}
