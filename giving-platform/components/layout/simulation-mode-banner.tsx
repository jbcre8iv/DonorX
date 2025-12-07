"use client";

import { TestTube, X, Power } from "lucide-react";
import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { toggleSimulationMode } from "@/app/admin/settings/actions";

interface SimulationModeBannerProps {
  enabled: boolean;
  isAdmin: boolean;
}

export function SimulationModeBanner({ enabled, isAdmin }: SimulationModeBannerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDisableSimulation = () => {
    startTransition(async () => {
      await toggleSimulationMode();
      setShowDropdown(false);
    });
  };

  // Auto-collapse after 1.5 seconds for admins
  useEffect(() => {
    if (enabled && isAdmin) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        // After animation starts, collapse after the animation duration
        setTimeout(() => {
          setCollapsed(true);
          setIsAnimating(false);
        }, 500); // Match the CSS transition duration
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [enabled, isAdmin]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  if (!enabled) {
    return null;
  }

  // Collapsed state - show dot indicator in header position
  if (collapsed) {
    return (
      <>
        {/* Fixed position dot - positioned to appear next to logo in header */}
        <div className="fixed top-[1.125rem] left-[120px] z-[100] no-print" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg transition-all hover:scale-110"
            aria-label="Simulation mode active"
          >
            <TestTube className="h-3 w-3 text-white" />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-40" />
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-3 bg-amber-50 border-b border-amber-100">
                <div className="flex items-center gap-2 text-amber-700">
                  <TestTube className="h-4 w-4" />
                  <span className="font-medium text-sm">Simulation Mode Active</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Donations will not process real payments
                </p>
              </div>
              <div className="p-2 space-y-1">
                {isAdmin && (
                  <button
                    onClick={handleDisableSimulation}
                    disabled={isPending}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Power className="h-4 w-4" />
                    <span>{isPending ? "Disabling..." : "Disable Simulation"}</span>
                  </button>
                )}
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <span>Manage Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setCollapsed(false);
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <span>Show Full Banner</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Full banner state with animation
  return (
    <div
      className={`bg-amber-500 text-white no-print transition-all duration-500 ease-in-out overflow-hidden ${
        isAnimating ? "max-h-0 opacity-0" : "max-h-20 opacity-100"
      }`}
    >
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
              onClick={() => setCollapsed(true)}
              className="rounded p-1 hover:bg-amber-600 transition-colors"
              aria-label="Minimize banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
