import Link from "next/link";
import {
  Heart,
  Shield,
  Users,
  Globe,
  Award,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FadeInUp,
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
  CornerBlob,
} from "@/components/ui/decorative-shapes";

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
    color: "rose",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description:
      "We vet every nonprofit and provide complete transparency on how donations are distributed.",
    color: "blue",
  },
  {
    icon: Users,
    title: "Community Focused",
    description:
      "We believe in the power of collective giving to transform communities worldwide.",
    color: "emerald",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "Supporting nonprofits across all causes and geographies to address the world's challenges.",
    color: "purple",
  },
];

const stats = [
  { value: "$2.4M+", label: "Donations Processed" },
  { value: "500+", label: "Verified Nonprofits" },
  { value: "150+", label: "Corporate Partners" },
  { value: "99.9%", label: "Platform Uptime" },
];

const team = [
  {
    name: "Leadership Team",
    icon: Target,
    description:
      "Our experienced leadership brings decades of expertise from philanthropy, technology, and finance.",
  },
  {
    name: "Engineering",
    icon: Zap,
    description:
      "World-class engineers building secure, scalable infrastructure for enterprise giving.",
  },
  {
    name: "Nonprofit Relations",
    icon: Heart,
    description:
      "Dedicated team ensuring every nonprofit meets our rigorous vetting standards.",
  },
];

const colorClasses = {
  rose: {
    bg: "bg-rose-100",
    text: "text-rose-600",
    border: "border-rose-200",
    gradient: "from-rose-500 to-pink-500",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200",
    gradient: "from-blue-500 to-cyan-500",
  },
  emerald: {
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    border: "border-emerald-200",
    gradient: "from-emerald-500 to-teal-500",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    border: "border-purple-200",
    gradient: "from-purple-500 to-violet-500",
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white py-20 sm:py-28">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GradientOrb
            className="absolute -top-40 -right-40 opacity-30"
            size="lg"
            from="from-blue-400"
            to="to-purple-400"
          />
          <GradientOrb
            className="absolute -bottom-20 -left-20 opacity-20"
            size="md"
            from="from-emerald-400"
            to="to-blue-400"
          />
          <FloatingDots className="absolute top-20 left-10 w-32 h-32 opacity-40" />
          <FloatingDots className="absolute bottom-20 right-20 w-24 h-24 opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInUp>
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-6">
                <Sparkles className="h-4 w-4" />
                Our Story
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Simplifying Corporate{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                  Philanthropy
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 sm:text-xl leading-relaxed">
                {config.appName} was founded with a simple mission: make it easy for
                corporations and family offices to support the causes they care about
                while reducing administrative burden.
              </p>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 sm:py-24 relative">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
          <Blob className="w-full h-full text-blue-500" animated />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <FadeInLeft>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  <Award className="h-4 w-4" />
                  Our Mission
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Empowering strategic philanthropy at scale
                </h2>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                  We believe that giving should be simple, transparent, and impactful.
                  Too often, corporations and high-net-worth individuals want to support
                  multiple causes but are deterred by the complexity of managing
                  relationships with dozens of nonprofits.
                </p>
                <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                  {config.appName} solves this by providing a single platform where donors
                  can discover vetted nonprofits, allocate funds across multiple organizations
                  with one donation, and receive consolidated tax documentation and impact reports.
                </p>
                <div className="mt-8">
                  <Button asChild>
                    <Link href="/directory">
                      Explore Nonprofits
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </FadeInLeft>

            <FadeInRight>
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-100 via-emerald-50 to-purple-100 p-8 shadow-lg">
                  <div className="h-full w-full rounded-xl bg-white shadow-xl overflow-hidden p-6">
                    {/* Strategic giving network illustration */}
                    <div className="h-full flex flex-col items-center justify-center relative">
                      {/* Central donor hub */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg z-10 animate-pulse-soft">
                        <Heart className="h-8 w-8 text-white" />
                      </div>

                      {/* Connection lines */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 225">
                        <line x1="150" y1="112" x2="60" y2="45" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 2" className="animate-dash" />
                        <line x1="150" y1="112" x2="240" y2="45" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 2" className="animate-dash" />
                        <line x1="150" y1="112" x2="45" y2="140" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 2" className="animate-dash" />
                        <line x1="150" y1="112" x2="255" y2="140" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 2" className="animate-dash" />
                        <line x1="150" y1="112" x2="80" y2="195" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 2" className="animate-dash" />
                        <line x1="150" y1="112" x2="220" y2="195" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 2" className="animate-dash" />
                      </svg>

                      {/* Nonprofit nodes */}
                      <div className="absolute top-2 left-8 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-300 animate-float">
                        <Globe className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="absolute top-2 right-8 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-300 animate-float" style={{ animationDelay: "0.5s" }}>
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-300 animate-float" style={{ animationDelay: "1s" }}>
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-300 animate-float" style={{ animationDelay: "1.5s" }}>
                        <Award className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="absolute bottom-2 left-12 w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-300 animate-float" style={{ animationDelay: "2s" }}>
                        <Heart className="h-5 w-5 text-rose-500" />
                      </div>
                      <div className="absolute bottom-2 right-12 w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center border-2 border-teal-300 animate-float" style={{ animationDelay: "2.5s" }}>
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative corner blob */}
                <CornerBlob position="bottom-right" className="opacity-60" />
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <FloatingDots className="absolute top-0 left-0 w-full h-full" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <StaggerContainer className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-white">{stat.value}</div>
                  <div className="mt-2 text-blue-100 font-medium">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 sm:py-24 relative">
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-10 pointer-events-none">
          <Blob className="w-full h-full text-emerald-500" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 mb-4">
                <Heart className="h-4 w-4" />
                What We Stand For
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Our Values
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                The principles that guide everything we do
              </p>
            </div>
          </FadeInUp>

          <StaggerContainer className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const colors = colorClasses[value.color as keyof typeof colorClasses];
              return (
                <StaggerItem key={value.title}>
                  <HoverLift>
                    <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="pt-8 pb-6 px-6 text-center">
                        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg} mb-6`}>
                          <value.icon className={`h-8 w-8 ${colors.text}`} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {value.title}
                        </h3>
                        <p className="mt-3 text-slate-600 leading-relaxed">{value.description}</p>
                      </CardContent>
                    </Card>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute top-20 right-10 opacity-20 pointer-events-none">
          <GradientOrb size="md" from="from-purple-400" to="to-pink-400" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInUp>
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 mb-4">
                <Users className="h-4 w-4" />
                The People Behind DonorX
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Our Team
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Passionate people dedicated to transforming corporate giving
              </p>
            </div>
          </FadeInUp>

          <StaggerContainer className="mt-16 grid gap-8 sm:grid-cols-3">
            {team.map((dept) => (
              <StaggerItem key={dept.name}>
                <HoverScale>
                  <Card className="h-full border-0 shadow-lg bg-white">
                    <CardContent className="p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6">
                        <dept.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900">{dept.name}</h3>
                      <p className="mt-3 text-slate-600 leading-relaxed">{dept.description}</p>
                    </CardContent>
                  </Card>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-600 opacity-5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Join hundreds of corporations and family offices already using {config.appName}{" "}
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
          </FadeInUp>
        </div>
      </section>
    </div>
  );
}
