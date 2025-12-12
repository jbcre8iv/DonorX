"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeTeamMember } from "./actions";

interface RemoveTeamMemberButtonProps {
  memberId: string;
  memberName: string;
}

export function RemoveTeamMemberButton({
  memberId,
  memberName,
}: RemoveTeamMemberButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRemove = async () => {
    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from the team? They will lose access to the nonprofit portal.`
      )
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await removeTeamMember(memberId);

      if (!result.success) {
        alert(result.error || "Failed to remove team member");
        return;
      }

      router.refresh();
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:bg-red-50"
      onClick={handleRemove}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
