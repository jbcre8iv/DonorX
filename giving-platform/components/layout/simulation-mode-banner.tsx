"use client";

import { TestTube, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface SimulationModeBannerProps {
  enabled: boolean;
  isAdmin: boolean;
}

export function SimulationModeBanner({ enabled, isAdmin }: SimulationModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!enabled || dismissed) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            <span className="text-sm font-medium">
              Simulation Mode Active - Donations will not process real payments
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin/settings"
                className="text-xs font-medium text-amber-100 hover:text-white underline underline-offset-2"
              >
                Manage
              </Link>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="rounded p-1 hover:bg-amber-600 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
