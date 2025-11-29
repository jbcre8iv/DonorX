"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markDonationComplete } from "./actions";

interface CompleteButtonProps {
  donationId: string;
}

export function CompleteButton({ donationId }: CompleteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    const result = await markDonationComplete(donationId);

    if (!result.success) {
      setError(result.error || "Failed to complete donation");
      setIsLoading(false);
    }
    // On success, the page will revalidate and show the updated status
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleComplete}
        disabled={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Completing...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Completed
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      <p className="text-xs text-slate-500 text-center">
        For simulated donations only
      </p>
    </div>
  );
}
