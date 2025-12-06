import Link from "next/link";
import { Linkedin, Instagram, Facebook } from "lucide-react";
import { config } from "@/lib/config";

// X (formerly Twitter) icon - custom SVG since lucide doesn't have it
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.982 10.622 20.54 3h-1.554l-5.693 6.618L8.745 3H3.5l6.876 10.007L3.5 21h1.554l6.012-6.989L15.868 21H21.5l-7.518-10.378Zm-2.128 2.474-.697-.997-5.543-7.93H8l4.474 6.4.697.996 5.815 8.318h-2.387l-4.745-6.787Z" />
    </svg>
  );
}

const footerLinks = {
  platform: [
    { href: "/directory", label: "Browse Nonprofits" },
    { href: "/directory", label: "Start Giving" },
    { href: "/about", label: "About Us" },
  ],
  resources: [
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
    { href: "/blog", label: "Blog" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-semibold text-slate-900">
                {config.appName}
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-600">{config.tagline}</p>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center h-5 w-5">
                <Linkedin className="h-5 w-5" />
              </span>
              <span className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center h-5 w-5">
                <Instagram className="h-5 w-5" />
              </span>
              <span className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center h-5 w-5">
                <Facebook className="h-5 w-5" />
              </span>
              <span className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center h-5 w-5">
                <XIcon className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Platform</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Resources</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Legal</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <p className="text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} {config.legal.entityName}. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
