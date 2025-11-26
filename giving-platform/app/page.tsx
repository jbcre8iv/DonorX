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
} from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

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
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {config.tagline}
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              The giving platform for corporations and family offices. Make one
              donation, support multiple causes, receive one tax receipt.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/donate">
                  Start Giving
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/directory">Browse Nonprofits</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-200 to-emerald-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Streamlined corporate giving in three simple steps
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <step.icon className="h-8 w-8 text-blue-700" />
                </div>
                <div className="absolute -right-4 top-8 hidden text-4xl font-bold text-slate-100 sm:block">
                  {index + 1}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Support Causes You Care About
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Choose from dozens of categories or distribute evenly across your
              favorite causes
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCounts.map((category) => (
              <Link key={category.id} href={`/directory?category=${category.slug}`}>
                <Card className="group cursor-pointer transition-all hover:border-blue-200 hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-6">
                    <span className="text-3xl">{category.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
                        {category.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {category.count} nonprofit{category.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" asChild>
              <Link href="/directory">
                View All Categories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Built for Enterprise
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              The tools and compliance features your organization needs
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {trustItems.map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <item.icon className="h-6 w-6 text-emerald-700" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
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
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-100 to-emerald-100 p-8">
                <div className="h-full w-full rounded-xl bg-white shadow-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-blue-700 px-6 py-20 sm:px-12 sm:py-28">
            <div className="relative mx-auto max-w-2xl text-center">
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
                  className="bg-white text-blue-700 hover:bg-blue-50"
                  asChild
                >
                  <Link href="/register">Get Started Free</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-blue-600"
                  asChild
                >
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-600 opacity-50" />
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-blue-800 opacity-50" />
          </div>
        </div>
      </section>
    </div>
  );
}
