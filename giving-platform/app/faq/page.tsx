import Link from "next/link";
import {
  HelpCircle,
  CreditCard,
  Receipt,
  RefreshCw,
  Shield,
  Building2,
  ChevronDown,
} from "lucide-react";
import { config } from "@/lib/config";

export const metadata = {
  title: "FAQ - Frequently Asked Questions",
  description: "Find answers to common questions about DonorX, donations, fees, and tax receipts.",
};

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    id: "processing-fees",
    icon: CreditCard,
    title: "Processing Fees",
    items: [
      {
        question: "Does DonorX charge a platform fee?",
        answer: "No. DonorX does not charge any platform fees. 100% of your donation amount goes toward the nonprofits you select, minus standard payment processing fees charged by our payment processor (Stripe).",
      },
      {
        question: "What are the payment processing fees?",
        answer: (
          <div className="space-y-3">
            <p>Payment processing fees are charged by Stripe, our payment processor, and vary by payment method:</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-4 font-medium text-slate-900">Payment Method</th>
                    <th className="text-left py-2 font-medium text-slate-900">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 pr-4 text-slate-600">Credit Card</td>
                    <td className="py-2 text-slate-600">2.9% + $0.30</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-slate-600">ACH Bank Transfer</td>
                    <td className="py-2 text-slate-600">0.8% (capped at $5)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-slate-600">Wire Transfer</td>
                    <td className="py-2 text-slate-600">$8 flat fee</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-slate-500 text-sm">
              For large donations, ACH or wire transfer can significantly reduce processing fees.
            </p>
          </div>
        ),
      },
      {
        question: "How do fees affect the nonprofits?",
        answer: "Payment processing fees are deducted from the donation amount before funds are disbursed to nonprofits. For example, if you donate $1,000 via credit card, approximately $970.70 will be distributed to your selected nonprofits after the 2.9% + $0.30 processing fee.",
      },
      {
        question: "Can I cover the processing fees?",
        answer: "We're working on adding an option for donors to cover processing fees so that 100% of the intended donation amount reaches nonprofits. This feature will be available soon.",
      },
    ],
  },
  {
    id: "tax-receipts",
    icon: Receipt,
    title: "Tax Receipts",
    items: [
      {
        question: "Will I receive a tax receipt?",
        answer: `Yes! ${config.appName} issues a single consolidated tax receipt for your entire donation, regardless of how many nonprofits you allocate to. This simplifies your tax documentation significantly.`,
      },
      {
        question: "When will I receive my tax receipt?",
        answer: "Tax receipts are emailed immediately after your donation is processed. You can also access all your receipts anytime from your dashboard under the Tax Receipts section.",
      },
      {
        question: "Is my donation tax-deductible?",
        answer: `${config.appName} is a registered 501(c)(3) nonprofit organization. All donations made through our platform are tax-deductible to the extent allowed by law. We recommend consulting with a tax professional for specific advice.`,
      },
    ],
  },
  {
    id: "recurring",
    icon: RefreshCw,
    title: "Recurring Donations",
    items: [
      {
        question: "How do recurring donations work?",
        answer: "When you set up a recurring donation, we automatically charge your payment method on the same day each month (or quarter/year, depending on your selection). Your allocation percentages remain the same for each recurring donation.",
      },
      {
        question: "Can I modify or cancel my recurring donation?",
        answer: "Yes! You can modify or cancel your recurring donation at any time from your dashboard. Changes take effect immediately, and no future charges will be made after cancellation.",
      },
      {
        question: "What happens if my payment fails?",
        answer: "If a recurring payment fails, we'll notify you via email and retry the payment after a few days. If payment continues to fail, we'll pause the recurring donation and ask you to update your payment method.",
      },
    ],
  },
  {
    id: "nonprofits",
    icon: Building2,
    title: "Nonprofits",
    items: [
      {
        question: "How are nonprofits vetted?",
        answer: `All nonprofits on ${config.appName} are verified 501(c)(3) organizations. We check their IRS tax-exempt status, review their financial health, and ensure they meet our standards for transparency and accountability.`,
      },
      {
        question: "How do nonprofits receive the funds?",
        answer: "Funds are disbursed to nonprofits on a monthly basis. Each nonprofit receives a single payment combining all donations allocated to them during that period, reducing their administrative burden.",
      },
      {
        question: "Can I request a nonprofit be added?",
        answer: (
          <>
            Yes! If you&apos;d like to support a nonprofit that isn&apos;t currently on our platform, you can{" "}
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 underline">
              contact us
            </Link>{" "}
            with their details and we&apos;ll review them for inclusion.
          </>
        ),
      },
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Security & Privacy",
    items: [
      {
        question: "Is my payment information secure?",
        answer: "Yes. We use Stripe, a PCI Level 1 certified payment processor, to handle all payment information. Your credit card details are never stored on our servers and are encrypted end-to-end.",
      },
      {
        question: "Who can see my donation history?",
        answer: "Your donation history is private and visible only to you. Nonprofits receive aggregated donation information but do not see individual donor details unless you choose to share them.",
      },
      {
        question: "Can I donate anonymously?",
        answer: "Yes. When making a donation, you can choose to remain anonymous. Anonymous donations will not share your name or contact information with the nonprofits receiving your donation.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-2 text-blue-700 font-medium mb-4">
              <HelpCircle className="h-5 w-5" />
              Help Center
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Find answers to common questions about {config.appName}, donations, fees, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-b border-slate-200 bg-white sticky top-16 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            {faqSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap transition-colors"
              >
                <section.icon className="h-4 w-4" />
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {faqSections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <section.icon className="h-5 w-5 text-blue-700" />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-6">
                  {section.items.map((item, index) => (
                    <details
                      key={index}
                      className="group rounded-lg border border-slate-200 bg-white"
                      open={section.id === "processing-fees" && index === 1}
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-slate-900 font-medium hover:bg-slate-50 transition-colors rounded-lg">
                        <span>{item.question}</span>
                        <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="px-5 pb-5 text-slate-600 leading-relaxed">
                        {item.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Still have questions?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Can&apos;t find the answer you&apos;re looking for? Our team is here to help.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-800 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
