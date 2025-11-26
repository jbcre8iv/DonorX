import Link from "next/link";
import {
  Heart,
  Shield,
  Users,
  Globe,
  Award,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About Us",
  description: "Learn about DonorX and our mission to simplify corporate philanthropy.",
};

const values = [
  {
    icon: Heart,
    title: "Impact First",
    description:
      "Every feature we build is designed to maximize the positive impact of charitable giving.",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description:
      "We vet every nonprofit and provide complete transparency on how donations are distributed.",
  },
  {
    icon: Users,
    title: "Community Focused",
    description:
      "We believe in the power of collective giving to transform communities worldwide.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "Supporting nonprofits across all causes and geographies to address the world's challenges.",
  },
];

const stats = [
  { value: "$50M+", label: "Donations Processed" },
  { value: "500+", label: "Verified Nonprofits" },
  { value: "1,000+", label: "Corporate Partners" },
  { value: "99.9%", label: "Platform Uptime" },
];

const team = [
  {
    name: "Leadership Team",
    description:
      "Our experienced leadership brings decades of expertise from philanthropy, technology, and finance.",
  },
  {
    name: "Engineering",
    description:
      "World-class engineers building secure, scalable infrastructure for enterprise giving.",
  },
  {
    name: "Nonprofit Relations",
    description:
      "Dedicated team ensuring every nonprofit meets our rigorous vetting standards.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Simplifying Corporate Philanthropy
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              {config.appName} was founded with a simple mission: make it easy for
              corporations and family offices to support the causes they care about
              while reducing administrative burden.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-blue-700 font-medium">
                <Award className="h-5 w-5" />
                Our Mission
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Empowering strategic philanthropy at scale
              </h2>
              <p className="mt-6 text-lg text-slate-600">
                We believe that giving should be simple, transparent, and impactful.
                Too often, corporations and high-net-worth individuals want to support
                multiple causes but are deterred by the complexity of managing
                relationships with dozens of nonprofits.
              </p>
              <p className="mt-4 text-lg text-slate-600">
                {config.appName} solves this by providing a single platform where donors
                can discover vetted nonprofits, allocate funds across multiple organizations
                with one donation, and receive consolidated tax documentation and impact reports.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-100 to-emerald-100 p-8">
                <div className="h-full w-full rounded-xl bg-white shadow-xl flex items-center justify-center">
                  <TrendingUp className="h-24 w-24 text-blue-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-700 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-white">{stat.value}</div>
                <div className="mt-2 text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Our Values
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              The principles that guide everything we do
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                  <value.icon className="h-7 w-7 text-blue-700" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Our Team
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Passionate people dedicated to transforming corporate giving
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {team.map((dept) => (
              <div
                key={dept.name}
                className="rounded-xl bg-white p-8 shadow-sm border border-slate-200"
              >
                <h3 className="text-lg font-semibold text-slate-900">{dept.name}</h3>
                <p className="mt-3 text-slate-600">{dept.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Join hundreds of corporations and family offices already using {config.appName}
              to streamline their philanthropic efforts.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/directory">Browse Nonprofits</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
