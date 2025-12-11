import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Building2,
  Users,
  Shield,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with our team to learn how DonorX can transform your corporate giving.",
};

const stats = [
  { value: "500+", label: "Vetted Nonprofits" },
  { value: "$2.4M", label: "Donations Processed" },
  { value: "24hr", label: "Response Time" },
  { value: "99.9%", label: "Platform Uptime" },
];

const features = [
  {
    icon: Building2,
    title: "Enterprise Ready",
    description: "Built for corporations and family offices with complex giving needs",
  },
  {
    icon: Users,
    title: "Dedicated Support",
    description: "White-glove onboarding and a dedicated account manager",
  },
  {
    icon: Shield,
    title: "Fully Compliant",
    description: "SOC 2 certified with comprehensive audit trails",
  },
];

export default function ContactPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section with Form */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-20 sm:py-28">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GradientOrb
            className="absolute -top-40 -right-40 opacity-20"
            size="xl"
            from="from-blue-500"
            to="to-purple-500"
          />
          <GradientOrb
            className="absolute -bottom-40 -left-40 opacity-15"
            size="lg"
            from="from-emerald-500"
            to="to-blue-500"
          />
          <FloatingDots className="absolute top-20 left-10 w-32 h-32 opacity-20" />
          <FloatingDots className="absolute bottom-20 right-10 w-24 h-24 opacity-15" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left - Text Content */}
            <FadeInLeft>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-400 mb-6">
                  <Clock className="h-4 w-4" />
                  We respond within 24 hours
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Let&apos;s talk about your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    giving goals
                  </span>
                </h1>
                <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-lg">
                  Whether you&apos;re a corporation looking to streamline employee giving or a family office
                  building a philanthropic strategy, we&apos;re here to help.
                </p>

                {/* Contact info inline */}
                <div className="mt-10 space-y-4">
                  <a href="mailto:hello@donorx.com" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <span>hello@donorx.com</span>
                  </a>
                  <a href="tel:+18005551234" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                      <Phone className="h-5 w-5" />
                    </div>
                    <span>+1 (800) 555-1234</span>
                  </a>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span>Georgetown, IN</span>
                  </div>
                </div>
              </div>
            </FadeInLeft>

            {/* Right - Contact Form */}
            <FadeInRight>
              <Card className="border-0 shadow-2xl bg-white">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Get in touch</h2>
                  <p className="text-slate-600 mb-6">Fill out the form and we&apos;ll be in touch soon.</p>

                  <form className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          First Name
                        </label>
                        <Input placeholder="John" className="h-11" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Last Name
                        </label>
                        <Input placeholder="Doe" className="h-11" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Work Email
                      </label>
                      <Input type="email" placeholder="john@company.com" className="h-11" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Company
                        </label>
                        <Input placeholder="Acme Inc." className="h-11" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          EIN <span className="text-red-500">*</span>
                        </label>
                        <Input placeholder="XX-XXXXXXX" className="h-11" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Organization Type
                      </label>
                      <select className="w-full h-11 rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                        <option value="">Select type...</option>
                        <option value="corporate">Corporation</option>
                        <option value="family_office">Family Office</option>
                        <option value="foundation">Private Foundation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        How can we help?
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us about your giving goals..."
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <Button type="submit" fullWidth size="lg">
                      Send Message
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-slate-500 text-center">
                      By submitting, you agree to our privacy policy.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="py-8 px-6 text-center">
                  <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Why organizations choose DonorX
              </h2>
              <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
                We&apos;ve built the platform that enterprise giving teams actually need.
              </p>
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mb-5">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
