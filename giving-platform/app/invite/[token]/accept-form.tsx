"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "./actions";

interface AcceptInvitationFormProps {
  token: string;
}

export function AcceptInvitationForm({ token }: AcceptInvitationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsLoading(true);
    setError(null);

    const result = await acceptInvitation(token);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Redirect to dashboard on success
      router.push("/dashboard");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        onClick={handleAccept}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Accepting...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept Invitation
          </>
        )}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        By accepting, you agree to join this organization and follow their policies.
      </p>
    </div>
  );
}
