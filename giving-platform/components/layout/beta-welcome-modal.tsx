"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Search,
  Heart,
  CreditCard,
  LayoutDashboard,
  FileText,
  Users,
  CheckCircle,
  Bug,
  MessageSquare,
  Rocket,
} from "lucide-react";

const STORAGE_KEY = "donorx_beta_welcome_shown";

export function BetaWelcomeModal() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Check if the user has already seen the welcome modal
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  if (!open || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop - no click to close, must use button */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header - Fixed */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Welcome to DonorX Beta!
                  </h2>
                  <p className="text-sm text-slate-500">
                    Thank you for being an early tester
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* About DonorX */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  What is DonorX?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  DonorX is a modern giving platform that makes charitable donations simple,
                  transparent, and impactful. Our mission is to connect generous donors with
                  vetted 501(c)(3) nonprofits, providing tools to track your giving journey
                  and maximize your philanthropic impact.
                </p>
              </div>

              {/* AI Features */}
              <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    AI-Powered Features
                  </h3>
                </div>
                <p className="text-slate-600 mb-3">
                  DonorX leverages artificial intelligence to enhance your giving experience:
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Smart Search</strong> - Natural language search across nonprofits by cause, location, or mission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Personalized Recommendations</strong> - AI suggests nonprofits based on your giving history and interests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Impact Summaries</strong> - Generate reports showing the collective impact of your donations</span>
                  </li>
                </ul>
              </div>

              {/* Key Features to Test */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Key Features to Test
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Search className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Nonprofit Directory</p>
                      <p className="text-xs text-slate-500">Browse, search, and filter nonprofits</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CreditCard className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Donation Flow</p>
                      <p className="text-xs text-slate-500">One-time and recurring donations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Heart className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Giving List & Favorites</p>
                      <p className="text-xs text-slate-500">Save and manage nonprofits</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <LayoutDashboard className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Donor Dashboard</p>
                      <p className="text-xs text-slate-500">Track history and impact</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <FileText className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Templates</p>
                      <p className="text-xs text-slate-500">Save allocation preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Users className="h-5 w-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Team Management</p>
                      <p className="text-xs text-slate-500">Invite family members</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Request */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Bug className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">
                      Found a bug or have feedback?
                    </h4>
                    <p className="text-sm text-amber-700">
                      We&apos;d love to hear from you! Please report any issues or share your
                      thoughts to help us improve DonorX before launch.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Contact: feedback@donor-x.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
              <Button
                onClick={handleDismiss}
                className="w-full h-12 text-base font-semibold"
              >
                <Rocket className="h-5 w-5 mr-2" />
                Start Testing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
