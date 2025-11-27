"use client";

import { useTransition } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveNonprofit, rejectNonprofit } from "./nonprofits/actions";

interface PendingApprovalButtonsProps {
  nonprofitId: string;
}

export function PendingApprovalButtons({ nonprofitId }: PendingApprovalButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveNonprofit(nonprofitId);
      if (result.error) {
        alert(`Error: ${result.error}`);
      }
    });
  };

  const handleReject = () => {
    if (!confirm("Are you sure you want to reject this nonprofit application?")) {
      return;
    }
    startTransition(async () => {
      const result = await rejectNonprofit(nonprofitId);
      if (result.error) {
        alert(`Error: ${result.error}`);
      }
    });
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
        onClick={handleApprove}
        title="Approve"
      >
        <CheckCircle className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={handleReject}
        title="Reject"
      >
        <XCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
