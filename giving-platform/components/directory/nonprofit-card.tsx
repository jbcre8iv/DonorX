"use client";

import Link from "next/link";
import { Globe, Eye, Heart, HandHeart, Check, Plus, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import type { Nonprofit } from "@/types/database";

interface NonprofitCardProps {
  nonprofit: Nonprofit;
  onQuickView?: (nonprofit: Nonprofit) => void;
}

export function NonprofitCard({ nonprofit, onQuickView }: NonprofitCardProps) {
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
    await toggleFavorite({
      nonprofitId: nonprofit.id,
      nonprofit: {
        id: nonprofit.id,
        name: nonprofit.name,
        logoUrl: nonprofit.logo_url || undefined,
        mission: nonprofit.mission || undefined,
      },
    });
  };

  return (
    <Card className="flex flex-col h-full group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/directory/${nonprofit.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            {nonprofit.logo_url ? (
              <img
                src={nonprofit.logo_url}
                alt={`${nonprofit.name} logo`}
                className="h-12 w-12 rounded-lg object-contain flex-shrink-0"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold text-lg flex-shrink-0">
                {nonprofit.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                {nonprofit.name}
              </h3>
              {nonprofit.category && (
                <Badge variant="secondary" className="mt-1">
                  {nonprofit.category.icon && (
                    <span className="mr-1">{nonprofit.category.icon}</span>
                  )}
                  {nonprofit.category.name}
                </Badge>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-1 flex-shrink-0">
            {nonprofit.featured && (
              <Badge variant="success">Featured</Badge>
            )}
            <button
              onClick={handleToggleFavorite}
              className={`rounded-full p-1.5 transition-colors ${
                favorited
                  ? "text-pink-500 bg-pink-50 hover:bg-pink-100"
                  : "text-slate-400 hover:text-pink-500 hover:bg-pink-50"
              }`}
              title={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-slate-600 line-clamp-3 flex-1">
          {nonprofit.mission || nonprofit.description || "No description available."}
        </p>

        {nonprofit.ein && (
          <p className="text-xs text-slate-400 mt-2">
            EIN: {nonprofit.ein}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/donate?nonprofit=${nonprofit.id}`}>Donate</Link>
          </Button>
          {/* Add to donation/cart button - changes based on draft state */}
          {hasDraft ? (
            <Button
              variant={inDraft ? "secondary" : "outline"}
              size="sm"
              onClick={handleAddToCartOrDraft}
              title={inDraft ? "In donation" : "Add to donation"}
              disabled={inDraft}
              className={!inDraft ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" : ""}
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
              variant={inCart ? "secondary" : "outline"}
              size="sm"
              onClick={handleAddToCartOrDraft}
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
          {onQuickView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickView(nonprofit)}
              title="Quick View"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {nonprofit.website && (
            <Button variant="outline" size="sm" asChild>
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
      </CardContent>
    </Card>
  );
}
