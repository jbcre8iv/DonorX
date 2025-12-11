"use client";

import Link from "next/link";
import { ExternalLink, Globe, CheckCircle, Check } from "lucide-react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import type { Nonprofit } from "@/types/database";

interface NonprofitModalProps {
  nonprofit: Nonprofit | null;
  open: boolean;
  onClose: () => void;
  onViewFullProfile?: (nonprofitId: string) => void;
  /** Custom action handler - if provided, overrides the default draft behavior */
  onAction?: () => void;
  /** Custom label for the action button (default: "Donate Now" or "Added") */
  actionLabel?: string;
  /** Whether the item is already added (for custom action mode) */
  isAdded?: boolean;
}

export function NonprofitModal({
  nonprofit,
  open,
  onClose,
  onViewFullProfile,
  onAction,
  actionLabel,
  isAdded: externalIsAdded,
}: NonprofitModalProps) {
  const { addToDraft, removeFromDraft, isInDraft } = useCartFavorites();
  const { addToast } = useToast();

  if (!nonprofit) return null;

  // Use external isAdded state if provided (custom action mode), otherwise use draft state
  const isAdded = externalIsAdded !== undefined ? externalIsAdded : isInDraft(nonprofit.id);

  const handleToggleDonate = async () => {
    // If custom action is provided, use it
    if (onAction) {
      onAction();
      return;
    }

    // Default behavior: toggle draft
    if (isAdded) {
      await removeFromDraft(nonprofit.id);
      addToast(`Removed ${nonprofit.name} from your donation`, "info", 3000);
    } else {
      await addToDraft({
        type: "nonprofit",
        targetId: nonprofit.id,
        targetName: nonprofit.name,
        logoUrl: nonprofit.logo_url || undefined,
      });
      addToast(`Added ${nonprofit.name} to your donation`, "success", 3000);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <ModalHeader>
        <div className="flex items-start gap-4 pr-8">
          {nonprofit.logo_url ? (
            <img
              src={nonprofit.logo_url}
              alt={`${nonprofit.name} logo`}
              className="h-16 w-16 rounded-xl object-contain border border-slate-200"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-2xl">
              {nonprofit.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">
              {nonprofit.name}
            </h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {nonprofit.category && (
                <Badge variant="secondary">
                  {nonprofit.category.icon && (
                    <span className="mr-1">{nonprofit.category.icon}</span>
                  )}
                  {nonprofit.category.name}
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-xs font-medium text-green-700 animate-[pulse-badge_0.6s_ease-out]">
                  <CheckCircle className="h-3 w-3 fill-green-600 text-white animate-[scale-check_0.4s_ease-out_0.2s_both]" />
                  Verified
                </span>
                <span className="text-sm text-slate-500">
                  EIN: {nonprofit.ein || "Not provided"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Mission */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Mission</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {nonprofit.mission || nonprofit.description || "No mission statement available."}
          </p>
        </div>

        {/* Description (if different from mission) */}
        {nonprofit.description && nonprofit.description !== nonprofit.mission && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">About</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {nonprofit.description}
            </p>
          </div>
        )}

        {/* Website */}
        {nonprofit.website && (
          <a
            href={nonprofit.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Globe className="h-4 w-4" />
            Visit Website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </ModalBody>

      <ModalFooter className="sm:justify-center">
        <Button
          onClick={handleToggleDonate}
          className={`w-full sm:w-auto order-1 sm:order-2 ${isAdded ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
        >
          {isAdded ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              Added
            </>
          ) : (
            actionLabel || "Donate Now"
          )}
        </Button>
        {onViewFullProfile ? (
          <Button variant="outline" onClick={() => onViewFullProfile(nonprofit.id)} className="w-full sm:w-auto order-2 sm:order-3">
            View Full Profile
          </Button>
        ) : (
          <Button variant="outline" asChild className="w-full sm:w-auto order-2 sm:order-3">
            <Link href={`/directory/${nonprofit.id}`} onClick={onClose}>
              View Full Profile
            </Link>
          </Button>
        )}
        <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto order-3 sm:order-1">
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
