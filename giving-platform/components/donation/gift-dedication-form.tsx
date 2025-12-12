"use client";

import * as React from "react";
import { Gift, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DedicationType } from "@/types/database";

export interface GiftDedication {
  type: DedicationType;
  honoreeName: string;
  notifyRecipient: boolean;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
}

interface GiftDedicationFormProps {
  value: GiftDedication | null;
  onChange: (dedication: GiftDedication | null) => void;
}

export function GiftDedicationForm({ value, onChange }: GiftDedicationFormProps) {
  const [isExpanded, setIsExpanded] = React.useState(value !== null);

  const handleToggle = () => {
    if (isExpanded) {
      // Collapse and clear
      setIsExpanded(false);
      onChange(null);
    } else {
      // Expand and initialize
      setIsExpanded(true);
      onChange({
        type: "in_honor_of",
        honoreeName: "",
        notifyRecipient: false,
      });
    }
  };

  const updateDedication = (updates: Partial<GiftDedication>) => {
    if (value) {
      onChange({ ...value, ...updates });
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-slate-700">
            Make this a gift dedication
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {/* Expanded form */}
      {isExpanded && value && (
        <div className="border-t border-slate-200 px-4 py-4 space-y-4">
          {/* Dedication type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Dedication type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateDedication({ type: "in_honor_of" })}
                className={cn(
                  "flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                  value.type === "in_honor_of"
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                In Honor Of
              </button>
              <button
                type="button"
                onClick={() => updateDedication({ type: "in_memory_of" })}
                className={cn(
                  "flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                  value.type === "in_memory_of"
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                In Memory Of
              </button>
            </div>
          </div>

          {/* Honoree name */}
          <Input
            label="Honoree's name"
            placeholder="Enter the person's name"
            value={value.honoreeName}
            onChange={(e) => updateDedication({ honoreeName: e.target.value })}
          />

          {/* Notify recipient toggle */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={value.notifyRecipient}
                onChange={(e) =>
                  updateDedication({
                    notifyRecipient: e.target.checked,
                    // Clear notification fields if unchecked
                    ...(e.target.checked
                      ? {}
                      : { recipientEmail: undefined, recipientName: undefined, personalMessage: undefined }),
                  })
                }
                className="peer sr-only"
              />
              <div className="h-5 w-5 rounded border-2 border-slate-300 bg-white transition-all peer-checked:border-purple-600 peer-checked:bg-purple-600 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-2 group-hover:border-slate-400 peer-checked:group-hover:border-purple-600">
                {value.notifyRecipient && (
                  <svg
                    className="h-full w-full text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">
                  Send a notification to someone
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                We'll email them about this dedication (your donation amount won't be shared)
              </p>
            </div>
          </label>

          {/* Notification fields (shown when notify is checked) */}
          {value.notifyRecipient && (
            <div className="space-y-4 pl-8 border-l-2 border-purple-100">
              <Input
                label="Recipient's name"
                placeholder="Who should we address the notification to?"
                value={value.recipientName || ""}
                onChange={(e) => updateDedication({ recipientName: e.target.value })}
              />
              <Input
                label="Recipient's email"
                type="email"
                placeholder="email@example.com"
                value={value.recipientEmail || ""}
                onChange={(e) => updateDedication({ recipientEmail: e.target.value })}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Personal message (optional)
                </label>
                <textarea
                  placeholder="Add a personal note to include in the notification..."
                  value={value.personalMessage || ""}
                  onChange={(e) => updateDedication({ personalMessage: e.target.value })}
                  rows={3}
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-0 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
