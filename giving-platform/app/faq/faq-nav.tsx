"use client";

import { useCallback } from "react";
import {
  CreditCard,
  Receipt,
  RefreshCw,
  Shield,
  Building2,
} from "lucide-react";

const navItems = [
  { id: "disbursement-fees", icon: CreditCard, title: "Disbursement Fees" },
  { id: "tax-receipts", icon: Receipt, title: "Tax Receipts" },
  { id: "recurring", icon: RefreshCw, title: "Recurring Donations" },
  { id: "nonprofits", icon: Building2, title: "Nonprofits" },
  { id: "security", icon: Shield, title: "Security & Privacy" },
];

export function FAQNav() {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // Update URL without scrolling
      window.history.pushState(null, "", `#${id}`);
    }
  }, []);

  return (
    <section className="border-b border-slate-200 bg-white sticky top-16 z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
