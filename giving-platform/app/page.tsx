import Link from "next/link";
import {
  Heart,
  Receipt,
  BarChart3,
  Building2,
  Users,
  Shield,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  FadeInUp,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  HoverLift,
} from "@/components/ui/motion";
import {
  Blob,
  GradientOrb,
  FloatingDots,
  CornerBlob,
} from "@/components/ui/decorative-shapes";

const steps = [
  {
    icon: Heart,
    title: "Choose Your Causes",
    description:
      "Browse our curated directory of vetted nonprofits or select entire cause categories.",
  },
  {
    icon: Receipt,
    title: "One Simple Donation",
    description:
      "Make a single donation and allocate it across multiple organizations as you see fit.",
  },
  {
    icon: BarChart3,
    title: "Track Your Impact",
    description:
      "Receive consolidated tax receipts and quarterly impact reports from all your beneficiaries.",
  },
];

const trustItems = [
  {
    icon: Building2,
    title: "Enterprise-Grade",
    description: "Built for corporations and family offices with sophisticated giving needs.",
  },
  {
    icon: Shield,
    title: "Fully Compliant",
    description: "All nonprofits are vetted 501(c)(3) organizations with verified EINs.",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Manage giving across your organization with role-based access.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch categories with nonprofit counts
  const { data: categories } = await supabase
    .from("categories")
    .select(`
      id,
      name,
      slug,
      icon,
      nonprofits:nonprofits(count)
    `)
    .order("name")
    .limit(6);

  // Transform categories to include count
  const categoriesWithCounts = categories?.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    count: (cat.nonprofits as unknown as { count: number }[])?.[0]?.count || 0,
  })) || [];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white py-20 sm:pt-32 sm:pb-36">
        {/* Decorative elements */}
        <Blob
          className="-top-32 -right-32 opacity-20"
          color="bg-blue-400"
          size="xl"
        />
        <Blob
          className="-bottom-48 -left-48 opacity-15"
          color="bg-emerald-400"
          size="xl"
        />
        <GradientOrb
          className="top-20 left-1/4 opacity-30"
          from="from-blue-300"
          to="to-purple-300"
          size="md"
        />
        <FloatingDots
          className="opacity-40"
          count={8}
          color="bg-blue-300"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              One Donation.<br />
              <span className="whitespace-nowrap text-gradient">Unlimited Impact.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              The giving platform for corporations and family offices. Make one
              donation, support multiple causes, receive one tax receipt.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button size="lg" asChild className="shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
                <Link href="/directory">
                  Start Giving
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="hover:bg-slate-50">
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Streamlined corporate giving in three simple steps
            </p>
          </FadeInUp>
          <StaggerContainer className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <StaggerItem key={step.title}>
                <HoverLift className="text-center">
                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                    {/* Gradient ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 opacity-20 blur-md" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-emerald-50 ring-1 ring-blue-100">
                      <step.icon className="h-8 w-8 text-blue-700" />
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-slate-600">{step.description}</p>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* For Nonprofits Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 py-16 sm:py-20">
        {/* Decorative corner blob */}
        <CornerBlob
          position="top-right"
          color="fill-emerald-400"
          className="w-64 h-64 opacity-20"
        />
        <Blob
          className="-bottom-32 -left-32 opacity-10"
          color="bg-teal-500"
          size="lg"
          animate={false}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            <FadeInUp className="max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 shadow-sm">
                <Building2 className="h-4 w-4" />
                For Nonprofits
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Get Your Organization Listed
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Join our directory and connect with donors who want to support your mission.
                Our AI-powered Quick Fill makes applying fast and easy.
              </p>
              <ul className="mt-6 space-y-3 text-left">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-slate-700">Free to list your organization</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-slate-700">AI-powered Quick Fill from your website</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-slate-700">Connect with corporate donors</span>
                </li>
              </ul>
            </FadeInUp>
            <FadeIn delay={0.2} className="flex flex-col items-center gap-4">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all" asChild>
                <Link href="/apply">
                  <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                  Apply to Join
                </Link>
              </Button>
              <p className="text-sm text-slate-500">
                No account required
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="relative bg-slate-50 py-20 sm:py-24 overflow-hidden">
        <FloatingDots className="opacity-20" count={5} color="bg-slate-400" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Support Causes You Care About
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Choose from dozens of categories or distribute evenly across your
              favorite causes
            </p>
          </FadeInUp>
          <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCounts.map((category) => (
              <StaggerItem key={category.id}>
                <Link href={`/directory?category=${category.slug}`}>
                  <HoverLift>
                    <Card className="group cursor-pointer transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10">
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 text-3xl shadow-sm ring-1 ring-slate-200/50 group-hover:ring-blue-200 transition-all">
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {category.count} nonprofit{category.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverLift>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <FadeInUp delay={0.3} className="mt-10 text-center">
            <Button variant="outline" asChild className="hover:bg-white">
              <Link href="/directory">
                View All Categories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </FadeInUp>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <GradientOrb
          className="-top-24 -right-24 opacity-20"
          from="from-purple-300"
          to="to-blue-300"
          size="lg"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Built for Enterprise
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              The tools and compliance features your organization needs
            </p>
          </FadeInUp>
          <StaggerContainer className="mt-16 grid gap-8 sm:grid-cols-3">
            {trustItems.map((item) => (
              <StaggerItem key={item.title}>
                <HoverLift className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-100 shadow-sm">
                    <item.icon className="h-7 w-7 text-emerald-700" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-slate-600">{item.description}</p>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features List */}
      <section className="relative bg-slate-50 py-20 sm:py-24 overflow-hidden">
        <Blob
          className="-top-48 -left-48 opacity-10"
          color="bg-blue-400"
          size="xl"
          animate={false}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <FadeInUp>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need for strategic philanthropy
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                {config.appName} provides all the tools your organization needs
                to manage charitable giving efficiently and effectively.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Single donation, multiple recipients",
                  "Consolidated year-end tax receipts",
                  "Quarterly impact reports",
                  "Saved allocation templates",
                  "Team member management",
                  "Recurring giving options",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                    </div>
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </FadeInUp>
            <FadeIn delay={0.2} className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-100 via-blue-50 to-emerald-100 p-8 shadow-2xl shadow-blue-500/10">
                <div className="h-full w-full rounded-2xl bg-white shadow-xl overflow-hidden ring-1 ring-slate-200/50">
                  {/* Dashboard mockup illustration */}
                  <div className="h-full flex flex-col">
                    {/* Header bar */}
                    <div className="h-12 bg-slate-800 flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <div className="ml-4 h-5 w-32 bg-slate-600 rounded" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-4 bg-slate-50">
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="h-2 w-12 bg-slate-200 rounded mb-2" />
                          <div className="h-5 w-16 bg-emerald-500 rounded" />
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="h-2 w-12 bg-slate-200 rounded mb-2" />
                          <div className="h-5 w-14 bg-blue-500 rounded" />
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="h-2 w-12 bg-slate-200 rounded mb-2" />
                          <div className="h-5 w-10 bg-purple-500 rounded" />
                        </div>
                      </div>
                      {/* Chart area */}
                      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                        <div className="h-2 w-24 bg-slate-200 rounded mb-3" />
                        <div className="flex items-end gap-2 h-20">
                          <div className="flex-1 bg-emerald-200 rounded-t h-[40%]" />
                          <div className="flex-1 bg-emerald-300 rounded-t h-[60%]" />
                          <div className="flex-1 bg-emerald-400 rounded-t h-[45%]" />
                          <div className="flex-1 bg-emerald-500 rounded-t h-[80%]" />
                          <div className="flex-1 bg-emerald-400 rounded-t h-[70%]" />
                          <div className="flex-1 bg-emerald-500 rounded-t h-[90%]" />
                          <div className="flex-1 bg-emerald-600 rounded-t h-full" />
                        </div>
                      </div>
                      {/* List items */}
                      <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100" />
                          <div className="flex-1">
                            <div className="h-2 w-24 bg-slate-200 rounded mb-1" />
                            <div className="h-2 w-16 bg-slate-100 rounded" />
                          </div>
                          <div className="h-4 w-12 bg-emerald-100 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100" />
                          <div className="flex-1">
                            <div className="h-2 w-20 bg-slate-200 rounded mb-1" />
                            <div className="h-2 w-14 bg-slate-100 rounded" />
                          </div>
                          <div className="h-4 w-10 bg-emerald-100 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100" />
                          <div className="flex-1">
                            <div className="h-2 w-28 bg-slate-200 rounded mb-1" />
                            <div className="h-2 w-12 bg-slate-100 rounded" />
                          </div>
                          <div className="h-4 w-14 bg-emerald-100 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 px-6 py-20 sm:px-12 sm:py-28 shadow-2xl shadow-blue-500/30">
              {/* Background decoration */}
              <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-500 opacity-30 blur-3xl animate-morph-blob" />
              <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-blue-400 opacity-30 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl" />

              {/* Floating dots */}
              <FloatingDots className="opacity-20" count={6} color="bg-white" />

              {/* Content - z-10 to stay above decorations */}
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Ready to transform your giving?
                </h2>
                <p className="mt-6 text-lg text-blue-100">
                  Join leading corporations and family offices using {config.appName}{" "}
                  to maximize their philanthropic impact.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all"
                    asChild
                  >
                    <Link href="/register">Get Started Free</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                    asChild
                  >
                    <Link href="/contact">Contact Sales</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>
    </div>
  );
}
