import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ApplicationForm } from "./application-form";
import {
  Building2,
  CheckCircle,
  Users,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react";
import {
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion";
import {
  GradientOrb,
  FloatingDots,
} from "@/components/ui/decorative-shapes";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Apply to Join | DonorX",
  description: "Apply to have your nonprofit organization listed in the DonorX directory",
};

const benefits = [
  {
    icon: Users,
    title: "Reach New Donors",
    description: "Connect with corporations and family offices actively looking to support causes like yours.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Impact",
    description: "Access a platform designed to help nonprofits scale their reach and funding.",
  },
  {
    icon: Shield,
    title: "Trusted Network",
    description: "Join a vetted directory of 501(c)(3) organizations that donors trust.",
  },
];

export default async function ApplyPage() {
  const supabase = await createClient();

  // Check if user is logged in and already has nonprofit access
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const adminClient = createAdminClient();
    const { data: nonprofitUsers } = await adminClient
      .from("nonprofit_users")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    // If user already has nonprofit access, redirect to their portal
    if (nonprofitUsers && nonprofitUsers.length > 0) {
      redirect("/nonprofit");
    }
  }

  // Fetch categories for the form
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white py-16 sm:py-20">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GradientOrb
            className="absolute -top-40 -right-40 opacity-25"
            size="lg"
            from="from-emerald-400"
            to="to-blue-400"
          />
          <GradientOrb
            className="absolute -bottom-20 -left-20 opacity-20"
            size="md"
            from="from-blue-400"
            to="to-purple-400"
          />
          <FloatingDots className="absolute top-20 right-20 w-32 h-32 opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInUp>
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-6">
                <Building2 className="h-4 w-4" />
                For Nonprofits
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                List Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                  Nonprofit
                </span>
              </h1>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Join our directory and connect with donors who want to support your mission.
                Applications are reviewed within 2-3 business days.
              </p>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid gap-8 md:grid-cols-3">
            {benefits.map((benefit) => (
              <StaggerItem key={benefit.title}>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <benefit.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{benefit.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{benefit.description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Form */}
            <FadeInLeft className="lg:col-span-2">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6 sm:p-8">
                  <ApplicationForm categories={categories || []} />
                </CardContent>
              </Card>
            </FadeInLeft>

            {/* Sidebar Info */}
            <FadeInRight>
              <div className="space-y-6">
                {/* Process Timeline */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Application Process
                    </h3>
                    <ol className="space-y-4">
                      {[
                        { step: "1", title: "Submit Application", desc: "Fill out the form with your organization details" },
                        { step: "2", title: "Review Period", desc: "Our team reviews within 2-3 business days" },
                        { step: "3", title: "Verification", desc: "We verify your 501(c)(3) status and information" },
                        { step: "4", title: "Go Live", desc: "Your nonprofit appears in our directory" },
                      ].map((item) => (
                        <li key={item.step} className="flex gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {item.step}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                {/* Requirements */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Requirements</h3>
                    <ul className="space-y-3">
                      {[
                        "Active 501(c)(3) status",
                        "Valid EIN number",
                        "Organization website",
                        "Mission statement",
                      ].map((req) => (
                        <li key={req} className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                          <span className="text-slate-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Contact */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                  <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Have questions about the application process? Contact our nonprofit relations team at{" "}
                    <a href="mailto:nonprofits@donorx.com" className="underline hover:text-white">
                      nonprofits@donorx.com
                    </a>
                  </p>
                </div>
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>
    </div>
  );
}
