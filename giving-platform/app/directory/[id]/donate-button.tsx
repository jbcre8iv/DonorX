"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";

interface DonateButtonProps {
  nonprofitId: string;
  nonprofitName: string;
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

export function DonateButton({
  nonprofitId,
  nonprofitName,
  size = "md",
  className = "",
  variant = "default",
}: DonateButtonProps) {
  const { addToDraft, isInDraft } = useCartFavorites();
  const { addToast } = useToast();

  const inDraft = isInDraft(nonprofitId);

  const handleDonate = async () => {
    if (!inDraft) {
      await addToDraft({
        type: "nonprofit",
        targetId: nonprofitId,
        targetName: nonprofitName,
        // Note: logo URL not available in this component - will show initial
      });
      addToast(`Added ${nonprofitName} to your donation`, "success", 3000);
    }
  };

  return (
    <Button
      onClick={handleDonate}
      disabled={inDraft}
      size={size}
      variant={variant}
      className={`${inDraft ? "bg-emerald-600 hover:bg-emerald-600" : ""} ${className}`}
    >
      {inDraft ? (
        <>
          <Check className="h-4 w-4 mr-1.5" />
          Added
        </>
      ) : (
        `Donate${size === "lg" ? ` to ${nonprofitName}` : " Now"}`
      )}
    </Button>
  );
}
