"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteImpactReport } from "../actions";

interface DeleteReportButtonProps {
  reportId: string;
}

export function DeleteReportButton({ reportId }: DeleteReportButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this impact report? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteImpactReport(reportId);

      if (!result.success) {
        alert(result.error || "Failed to delete report");
        return;
      }

      router.refresh();
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:bg-red-50"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
