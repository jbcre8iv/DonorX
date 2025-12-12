"use client";

import { EyeOff } from "lucide-react";

interface AnonymousToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function AnonymousToggle({ checked, onChange }: AnonymousToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-5 w-5 rounded border-2 border-slate-300 bg-white transition-all peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 group-hover:border-slate-400 peer-checked:group-hover:border-blue-600">
          {checked && (
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
          <EyeOff className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">Make my donation anonymous</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Your name will be hidden from public donor lists and displays
        </p>
      </div>
    </label>
  );
}
