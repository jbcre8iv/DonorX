"use client";

import { useState } from "react";
import { Check, X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveUser, rejectUser, deleteUser } from "./actions";

interface UserApprovalButtonsProps {
  userId: string;
  userStatus: "pending" | "approved" | "rejected";
}

export function UserApprovalButtons({
  userId,
  userStatus,
}: UserApprovalButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);
    const result = await approveUser(userId);
    if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleReject = async () => {
    setIsLoading(true);
    setError(null);
    const result = await rejectUser(userId);
    if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await deleteUser(userId);
    if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  if (userStatus === "approved") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {userStatus === "pending" && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={handleApprove}
            className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </>
      )}
      {userStatus === "rejected" && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleDelete}
          className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      )}
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
