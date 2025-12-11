import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Building2,
  HeadphonesIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  StaggerContainer,
  StaggerItem,
  HoverLift,
} from "@/components/ui/motion";
import {
  GradientOrb,
  FloatingDots,
  Blob,
} from "@/components/ui/decorative-shapes";

export const metadata = {
  title: "Contact Sales",
  description: "Get in touch with our team to learn how DonorX can transform your corporate giving.",
};

const benefits = [
  "Streamlined donation management",
  "Comprehensive tax reporting",
  "Impact tracking and analytics",
  "White-glove onboarding support",
  "Dedicated account manager",
  "Custom integration options",
];

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    value: "sales@donorx.com",
    href: "mailto:sales@donorx.com",
    color: "blue",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+1 (800) 555-1234",
    href: "tel:+18005551234",
    color: "emerald",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "123 Philanthropy Lane\nSan Francisco, CA 94102",
    href: null,
    color: "purple",
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: "Monday - Friday: 9am - 6pm PT",
    href: null,
    color: "amber",
  },
];

const colorClasses = {
  blue: "bg-blue-100 text-blue-700",
  emerald: "bg-emerald-100 text-emerald-700",
  purple: "bg-purple-100 text-purple-700",
  amber: "bg-amber-100 text-amber-700",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white py-16 sm:py-20">
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
          <FloatingDots className="absolute top-10 left-10 w-24 h-24 opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <FadeInUp>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-6">
                <MessageSquare className="h-4 w-4" />
                Get in Touch
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Contact Our{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                  Sales Team
                </span>
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Ready to transform your corporate giving? Our team is here to help you
                find the perfect solution for your organization.
              </p>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16 relative">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
          <Blob className="w-full h-full text-blue-500" animated />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Contact Form */}
            <FadeInLeft>
              <Card className="border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                      <HeadphonesIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Get in Touch</CardTitle>
                      <CardDescription>
                        We&apos;ll get back to you within 24 hours.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
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
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Company Name
                      </label>
                      <Input placeholder="Acme Inc." className="h-11" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Organization Type
                      </label>
                      <select className="w-full h-11 rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                        <option value="">Select type...</option>
                        <option value="corporate">Corporate</option>
                        <option value="family_office">Family Office</option>
                        <option value="foundation">Foundation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Message
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Tell us about your giving goals..."
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <Button type="submit" fullWidth size="lg" className="mt-2">
                      Send Message
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-slate-500 text-center pt-2">
                      By submitting this form, you agree to our privacy policy.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </FadeInLeft>

            {/* Contact Info */}
            <FadeInRight>
              <div className="space-y-6">
                {/* Contact Methods */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle>Contact Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <StaggerContainer className="space-y-4">
                      {contactMethods.map((method) => (
                        <StaggerItem key={method.title}>
                          <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClasses[method.color as keyof typeof colorClasses]}`}>
                              <method.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{method.title}</p>
                              {method.href ? (
                                <a href={method.href} className="text-blue-600 hover:text-blue-700 hover:underline">
                                  {method.value}
                                </a>
                              ) : (
                                <p className="text-slate-600 whitespace-pre-line">{method.value}</p>
                              )}
                            </div>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </CardContent>
                </Card>

                {/* Why Choose Us */}
                <HoverLift>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-emerald-50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle>Why Choose DonorX?</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {benefits.map((item) => (
                          <li key={item} className="flex items-center gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="text-slate-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </HoverLift>

                {/* Quick Response Promise */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Clock className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg">Quick Response Promise</h3>
                  </div>
                  <p className="text-blue-100 leading-relaxed">
                    Our team responds to all inquiries within 24 hours during business days.
                    For urgent matters, please call us directly.
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
