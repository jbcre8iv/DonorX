"use client";

import * as React from "react";
import Link from "next/link";
import { Globe, Eye, Heart, HandHeart, Check, Plus, ChevronDown, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import type { Nonprofit } from "@/types/database";

interface NonprofitTableProps {
  nonprofits: Nonprofit[];
  onQuickView?: (nonprofit: Nonprofit) => void;
}

// Action buttons component - defined outside to avoid recreating during render
function ActionButtons({
  className = "",
  nonprofit,
  inCart,
  inDraft,
  hasDraft,
  favorited,
  onAddToCartOrDraft,
  onToggleFavorite,
  onQuickView,
}: {
  className?: string;
  nonprofit: Nonprofit;
  inCart: boolean;
  inDraft: boolean;
  hasDraft: boolean;
  favorited: boolean;
  onAddToCartOrDraft: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onQuickView?: (nonprofit: Nonprofit) => void;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button asChild size="sm" className="h-8">
        <Link href={`/donate?nonprofit=${nonprofit.id}`}>Donate</Link>
      </Button>
      {/* Add to donation/cart button - changes based on draft state */}
      {hasDraft ? (
        <Button
          variant={inDraft ? "secondary" : "ghost"}
          size="sm"
          className={`h-8 w-8 p-0 ${!inDraft ? "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" : ""}`}
          onClick={onAddToCartOrDraft}
          title={inDraft ? "In donation" : "Add to donation"}
          disabled={inDraft}
        >
          {inDraft ? (
            <Check className="h-4 w-4" />
          ) : (
            <span className="flex items-center gap-0.5">
              <Plus className="h-3 w-3" />
              <CreditCard className="h-4 w-4" />
            </span>
          )}
        </Button>
      ) : (
        <Button
          variant={inCart ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onAddToCartOrDraft}
          title={inCart ? "In giving list" : "Add to giving list"}
          disabled={inCart}
        >
          {inCart ? (
            <Check className="h-4 w-4" />
          ) : (
            <span className="flex items-center gap-0.5">
              <Plus className="h-3 w-3" />
              <HandHeart className="h-4 w-4" />
            </span>
          )}
        </Button>
      )}
      <button
        onClick={onToggleFavorite}
        className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${
          favorited
            ? "text-pink-500 bg-pink-50 hover:bg-pink-100"
            : "text-slate-400 hover:text-pink-500 hover:bg-pink-50"
        }`}
        title={favorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
      </button>
      {onQuickView && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onQuickView(nonprofit)}
          title="Quick View"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {/* Fixed-width container for external link to prevent layout shift */}
      <div className="w-8 h-8 flex items-center justify-center">
        {nonprofit.website && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <a
              href={nonprofit.website}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Website"
            >
              <Globe className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function NonprofitRow({
  nonprofit,
  onQuickView,
  isExpanded,
  onToggleExpand,
}: {
  nonprofit: Nonprofit;
  onQuickView?: (nonprofit: Nonprofit) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const { addToCart, isInCart, toggleFavorite, isFavorite, hasDraft, addToDraft, isInDraft } = useCartFavorites();
  const { addToast } = useToast();

  const inCart = isInCart(nonprofit.id);
  const inDraft = isInDraft(nonprofit.id);
  const favorited = isFavorite(nonprofit.id);

  const handleAddToCartOrDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If there's an active draft, add directly to the draft allocations
    if (hasDraft) {
      if (!inDraft) {
        await addToDraft({
          type: "nonprofit",
          targetId: nonprofit.id,
          targetName: nonprofit.name,
        });
        addToast(`Added ${nonprofit.name} to your donation`, "success", 3000);
      }
      return;
    }

    // Otherwise, add to cart as before
    if (!inCart) {
      const result = await addToCart({
        nonprofitId: nonprofit.id,
        nonprofit: {
          id: nonprofit.id,
          name: nonprofit.name,
          logoUrl: nonprofit.logo_url || undefined,
          mission: nonprofit.mission || undefined,
        },
      });

      if (!result.success) {
        if (result.reason === "cart_full") {
          addToast("Your giving list is full (max 10 items).", "warning");
        }
      }
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggleFavorite({
      nonprofitId: nonprofit.id,
      nonprofit: {
        id: nonprofit.id,
        name: nonprofit.name,
        logoUrl: nonprofit.logo_url || undefined,
        mission: nonprofit.mission || undefined,
      },
    });

    if (!result.success && result.requiresAuth) {
      addToast("Please sign in to save favorites", "info", 3000);
    }
  };

  return (
    <>
      <tr
        className="text-sm hover:bg-slate-50 transition-colors sm:cursor-default cursor-pointer"
        onClick={() => {
          // On mobile, clicking the row expands/collapses
          if (window.innerWidth < 640) {
            onToggleExpand();
          }
        }}
      >
        <td className="py-3 pr-2 sm:pr-4">
          {/* Desktop: Link to detail page */}
          <Link
            href={`/directory/${nonprofit.id}`}
            className="hidden sm:flex items-center gap-3 group"
          >
            {nonprofit.logo_url ? (
              <img
                src={nonprofit.logo_url}
                alt={`${nonprofit.name} logo`}
                className="h-10 w-10 rounded-lg object-contain flex-shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold flex-shrink-0">
                {nonprofit.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors block truncate">
                {nonprofit.name}
              </span>
              {nonprofit.ein && (
                <p className="text-xs text-slate-400 truncate">EIN: {nonprofit.ein}</p>
              )}
            </div>
          </Link>
          {/* Mobile: Non-link content (row click handles expand) */}
          <div className="flex sm:hidden items-center gap-2">
            {nonprofit.logo_url ? (
              <img
                src={nonprofit.logo_url}
                alt={`${nonprofit.name} logo`}
                className="h-10 w-10 rounded-lg object-contain flex-shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold flex-shrink-0">
                {nonprofit.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="font-medium text-slate-900 block truncate">
                {nonprofit.name}
              </span>
              {nonprofit.ein && (
                <p className="text-xs text-slate-400 truncate">EIN: {nonprofit.ein}</p>
              )}
              {nonprofit.category && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {nonprofit.category.icon && (
                    <span className="mr-1">{nonprofit.category.icon}</span>
                  )}
                  {nonprofit.category.name}
                </Badge>
              )}
            </div>
          </div>
        </td>
        <td className="py-3 pr-4 hidden sm:table-cell">
          {nonprofit.category && (
            <Badge variant="secondary">
              {nonprofit.category.icon && (
                <span className="mr-1">{nonprofit.category.icon}</span>
              )}
              {nonprofit.category.name}
            </Badge>
          )}
        </td>
        <td className="py-3 pr-4 hidden lg:table-cell">
          <p className="text-slate-600 line-clamp-2 max-w-md">
            {nonprofit.mission || nonprofit.description || "No description"}
          </p>
        </td>
        {/* Desktop actions - hidden on mobile */}
        <td className="py-3 hidden sm:table-cell">
          <ActionButtons
            className="justify-end"
            nonprofit={nonprofit}
            inCart={inCart}
            inDraft={inDraft}
            hasDraft={hasDraft}
            favorited={favorited}
            onAddToCartOrDraft={handleAddToCartOrDraft}
            onToggleFavorite={handleToggleFavorite}
            onQuickView={onQuickView}
          />
        </td>
        {/* Mobile expand button */}
        <td className="py-3 sm:hidden">
          <button
            onClick={onToggleExpand}
            className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label={isExpanded ? "Hide actions" : "Show actions"}
          >
            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </td>
      </tr>
      {/* Mobile expanded actions row */}
      {isExpanded && (
        <tr className="sm:hidden bg-slate-50">
          <td colSpan={2} className="py-3 px-4">
            <ActionButtons
              className="justify-start flex-wrap"
              nonprofit={nonprofit}
              inCart={inCart}
              inDraft={inDraft}
              hasDraft={hasDraft}
              favorited={favorited}
              onAddToCartOrDraft={handleAddToCartOrDraft}
              onToggleFavorite={handleToggleFavorite}
              onQuickView={onQuickView}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function NonprofitTable({ nonprofits, onQuickView }: NonprofitTableProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (nonprofits.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No nonprofits found matching your criteria.</p>
      </div>
    );
  }

  const handleToggleExpand = (nonprofitId: string) => {
    setExpandedId(expandedId === nonprofitId ? null : nonprofitId);
  };

  return (
    <div className="sm:overflow-x-auto">
      <table className="w-full table-fixed sm:table-auto">
        <thead>
          <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
            <th className="pb-3 font-medium">Organization</th>
            <th className="pb-3 font-medium hidden sm:table-cell">Category</th>
            <th className="pb-3 font-medium hidden lg:table-cell">Mission</th>
            <th className="pb-3 font-medium text-right hidden sm:table-cell">Actions</th>
            <th className="pb-3 sm:hidden w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {nonprofits.map((nonprofit) => (
            <NonprofitRow
              key={nonprofit.id}
              nonprofit={nonprofit}
              onQuickView={onQuickView}
              isExpanded={expandedId === nonprofit.id}
              onToggleExpand={() => handleToggleExpand(nonprofit.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
