"use client";

import { useState, useSyncExternalStore } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Use useSyncExternalStore to safely access window.location after hydration
function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );
}

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();
  const registrationUrl = origin ? `${origin}/register` : "/register";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="flex-1 rounded bg-white px-3 py-2 text-sm text-slate-700 border border-slate-200">
        {registrationUrl}
      </code>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="shrink-0"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1 text-emerald-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </>
        )}
      </Button>
    </div>
  );
}
