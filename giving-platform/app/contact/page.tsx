import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "Contact Sales",
};

export default function ContactPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Contact Our Sales Team
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Ready to transform your corporate giving? Our team is here to help you
            find the perfect solution for your organization.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      First Name
                    </label>
                    <Input placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Last Name
                    </label>
                    <Input placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Work Email
                  </label>
                  <Input type="email" placeholder="john@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name
                  </label>
                  <Input placeholder="Acme Inc." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Organization Type
                  </label>
                  <select className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Select type...</option>
                    <option value="corporate">Corporate</option>
                    <option value="family_office">Family Office</option>
                    <option value="foundation">Foundation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your giving goals..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <Button type="submit" fullWidth>
                  Send Message
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  By submitting this form, you agree to our privacy policy.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Email</p>
                    <a href="mailto:sales@donorx.com" className="text-blue-700 hover:underline">
                      sales@donorx.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Phone</p>
                    <a href="tel:+18005551234" className="text-blue-700 hover:underline">
                      +1 (800) 555-1234
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Office</p>
                    <p className="text-slate-600">
                      123 Philanthropy Lane<br />
                      San Francisco, CA 94102
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Business Hours</p>
                    <p className="text-slate-600">
                      Monday - Friday: 9am - 6pm PT
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Choose DonorX?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Streamlined donation management",
                    "Comprehensive tax reporting",
                    "Impact tracking and analytics",
                    "White-glove onboarding support",
                    "Dedicated account manager",
                    "Custom integration options",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-700" />
                      <span className="text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
