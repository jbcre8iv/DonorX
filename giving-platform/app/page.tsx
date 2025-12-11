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
  TrendingUp,
  Globe,
  Landmark,
} from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  FadeInUp,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  StaggerContainer,
  StaggerItem,
  HoverLift,
  HoverScale,
} from "@/components/ui/motion";
import {
  Blob,
  GradientOrb,
  FloatingDots,
} from "@/components/ui/decorative-shapes";

const steps = [
  {
    icon: Heart,
    title: "Choose Your Causes",
    description:
      "Browse our curated directory of vetted nonprofits or select entire cause categories.",
    tooltip: "Browse 500+ vetted nonprofits across 12 cause areas",
    href: "/directory",
  },
  {
    icon: Receipt,
    title: "One Simple Donation",
    description:
      "Make a single donation and allocate it across multiple organizations as you see fit.",
    tooltip: "Split your gift across multiple organizations with one transaction",
    href: "/donate",
  },
  {
    icon: BarChart3,
    title: "Track Your Impact",
    description:
      "Receive consolidated tax receipts and quarterly impact reports from all your beneficiaries.",
    tooltip: "Get consolidated tax receipts and quarterly impact reports",
    href: "/dashboard",
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
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white pt-16 pb-24 sm:pt-24 sm:pb-32">
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
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Text Content */}
            <FadeInLeft className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-blue-100 mb-6">
                <Landmark className="h-4 w-4" />
                For Corporations & Family Offices
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                One Donation.<br />
                <span className="whitespace-nowrap text-gradient">Unlimited Impact.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 sm:text-xl max-w-xl mx-auto lg:mx-0">
                The giving platform for corporations and family offices. Make one
                donation, support multiple causes, receive one tax receipt.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
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
              <p className="mt-6 text-sm text-slate-500 text-center lg:text-left">
                Are you a nonprofit?{" "}
                <Link href="/apply" className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
                  Apply to join our directory →
                </Link>
              </p>
            </FadeInLeft>

            {/* Right: Hero Illustration - Connected Giving Flow */}
            <FadeInRight delay={0.2} className="relative hidden lg:block">
              <div className="relative aspect-square max-w-lg mx-auto">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-emerald-50 to-purple-100 rounded-full blur-3xl opacity-60" />

                {/* Central hub - represents the donor/platform */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl blur-xl opacity-40 scale-110" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-2xl font-bold">$</div>
                        <div className="text-xs opacity-80">One Gift</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated flow lines - SVG (behind cards) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 400">
                  {/* Flow paths from center to each node */}
                  <defs>
                    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  {/* Health - top center */}
                  <path d="M200,200 Q200,120 200,40" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" />
                  {/* Education - top right */}
                  <path d="M200,200 Q300,140 360,72" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "0.3s" }} />
                  {/* Environment - bottom right */}
                  <path d="M200,200 Q300,260 360,328" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "0.6s" }} />
                  {/* Housing - bottom center */}
                  <path d="M200,200 Q200,280 200,360" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "0.9s" }} />
                  {/* Food - bottom left */}
                  <path d="M200,200 Q100,260 40,328" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "1.2s" }} />
                  {/* Arts - top left */}
                  <path d="M200,200 Q100,140 40,72" stroke="url(#flowGradient)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-dash" style={{ animationDelay: "1.5s" }} />
                </svg>

                {/* Orbiting cause nodes (above lines) */}
                {[
                  { icon: "🏥", label: "Health", position: "top-4 left-1/2 -translate-x-1/2", delay: "0s" },
                  { icon: "🎓", label: "Education", position: "top-[18%] right-4", delay: "0.5s" },
                  { icon: "🌍", label: "Environment", position: "bottom-[18%] right-4", delay: "1s" },
                  { icon: "🏠", label: "Housing", position: "bottom-4 left-1/2 -translate-x-1/2", delay: "1.5s" },
                  { icon: "🍲", label: "Food", position: "bottom-[18%] left-4", delay: "2s" },
                  { icon: "🎨", label: "Arts", position: "top-[18%] left-4", delay: "2.5s" },
                ].map((cause, i) => (
                  <div
                    key={i}
                    className={`absolute ${cause.position} animate-float z-10`}
                    style={{ animationDelay: cause.delay }}
                  >
                    <div className="relative group">
                      <div className="w-[72px] h-[72px] bg-white rounded-xl shadow-lg ring-1 ring-slate-200/50 flex flex-col items-center justify-center gap-0.5 transition-all group-hover:scale-110 group-hover:shadow-xl">
                        <span className="text-2xl">{cause.icon}</span>
                        <span className="text-[11px] text-slate-600 font-medium leading-tight">{cause.label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeInRight>
          </div>
        </div>

      </section>

      {/* Social Proof / Trust Bar */}
      <section className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">500+</div>
                <div className="mt-1 text-sm text-blue-100 flex items-center justify-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  Vetted Nonprofits
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">$2.4M+</div>
                <div className="mt-1 text-sm text-blue-100 flex items-center justify-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  Donations Processed
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">150+</div>
                <div className="mt-1 text-sm text-blue-100 flex items-center justify-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Corporate Partners
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">12</div>
                <div className="mt-1 text-sm text-blue-100 flex items-center justify-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  Cause Categories
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 sm:py-24 overflow-hidden bg-white">
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
                <Link href={step.href} className="block h-full group/card">
                  <Card className="relative h-full overflow-hidden transition-all duration-500 ease-out hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 group bg-white cursor-pointer">
                    {/* Main content */}
                    <div className="relative z-10 text-center p-8 pb-28 bg-white">
                      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                        {/* Animated gradient ring on hover */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300" />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-emerald-50 ring-1 ring-blue-100 group-hover:ring-blue-300 transition-all duration-300 group-hover:scale-110">
                          <step.icon className="h-8 w-8 text-blue-700" />
                        </div>
                        {/* Step number badge */}
                        <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {index + 1}
                        </div>
                      </div>
                      <h3 className="mt-6 text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-slate-600">{step.description}</p>
                    </div>
                    {/* Slideup illustration panel - rises from bottom inside card */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-50 to-emerald-50 border-t border-blue-100 translate-y-full group-hover/card:translate-y-0 transition-transform duration-500 ease-out flex items-center justify-center">
                      <div className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 delay-150">
                        {index === 0 && (
                          /* Choose Your Causes - Grid of cause icons */
                          <div className="flex gap-2">
                            {["❤️", "🌱", "📚", "🏠", "🍽️", "🎨"].map((emoji, i) => (
                              <div key={i} className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg animate-float" style={{ animationDelay: `${i * 0.1}s` }}>
                                {emoji}
                              </div>
                            ))}
                          </div>
                        )}
                        {index === 1 && (
                          /* One Simple Donation - Flow diagram */
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">$</div>
                            <svg className="w-8 h-6 text-blue-400" viewBox="0 0 32 24" fill="none">
                              <path d="M0 12 L24 12 M18 6 L24 12 L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="flex gap-1">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center animate-float" style={{ animationDelay: `${i * 0.15}s` }}>
                                  <Building2 className="w-5 h-5 text-emerald-600" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {index === 2 && (
                          /* Track Your Impact - Chart */
                          <div className="flex items-center gap-4">
                            <div className="flex items-end gap-1 h-14">
                              {[40, 55, 45, 65, 80].map((h, i) => (
                                <div
                                  key={i}
                                  className="w-5 rounded-t bg-gradient-to-t from-blue-600 to-blue-400 animate-float"
                                  style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-semibold">+24%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Connecting lines between steps (desktop only) */}
          <div className="hidden sm:flex justify-center mt-8">
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
              <ArrowRight className="h-5 w-5" />
              <div className="w-24 h-0.5 bg-slate-200" />
              <ArrowRight className="h-5 w-5" />
              <div className="w-24 h-0.5 bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />
            </div>
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
