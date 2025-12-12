"use client";

import * as React from "react";
import { Building2, Check, Heart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import { useFloatingHeart } from "@/components/ui/floating-heart";
import type { Category } from "@/types/database";

interface CategoryCardProps {
  category: Category;
  nonprofitCount: number;
  onViewOrgs?: (categoryId: string) => void;
}

export function CategoryCard({ category, nonprofitCount, onViewOrgs }: CategoryCardProps) {
  const { addToDraft, removeFromDraft, isInDraft, toggleFavorite, isFavorite, userId } = useCartFavorites();
  const { addToast } = useToast();
  const { triggerFloatingHeart } = useFloatingHeart();
  const favoriteButtonRef = React.useRef<HTMLButtonElement>(null);
  const isLoggedIn = !!userId;

  const inDraft = isInDraft(category.id);
  const favorited = isFavorite(undefined, category.id);

  // Toggle donate handler - adds to or removes from draft
  const handleToggleDonate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inDraft) {
      await removeFromDraft(category.id);
      addToast(`Removed ${category.name} from your donation`, "info", 3000);
    } else {
      await addToDraft({
        type: "category",
        targetId: category.id,
        targetName: category.name,
      });
      addToast(`Added ${category.name} to your donation`, "success", 3000);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If not logged in, show a subtle reminder with sign in link
    if (!isLoggedIn) {
      addToast("Sign in to save favorites", "info", 4000, {
        label: "Sign in",
        href: "/login?redirect=/directory?view=causes",
      });
      return;
    }

    // Trigger flying heart animation when adding (not removing)
    if (!favorited && favoriteButtonRef.current) {
      triggerFloatingHeart(favoriteButtonRef.current);
    }

    await toggleFavorite({
      categoryId: category.id,
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon || undefined,
      },
    });
  };

  return (
    <Card className="flex flex-col h-full group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Category Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl flex-shrink-0">
              {category.icon || "📁"}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {nonprofitCount} nonprofit{nonprofitCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="relative group/fav">
              <button
                ref={favoriteButtonRef}
                onClick={handleToggleFavorite}
                className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  !isLoggedIn
                    ? "text-slate-300 border-slate-200 bg-slate-50"
                    : favorited
                    ? "text-pink-500 bg-pink-50 border-pink-200 hover:bg-pink-100 hover:shadow-md"
                    : "text-slate-600 border-slate-200 bg-white hover:text-pink-500 hover:border-pink-300 hover:bg-pink-50 hover:shadow-md"
                }`}
              >
                <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
                {!isLoggedIn ? "Sign in to save favorites" : favorited ? "Remove from favorites" : "Add to favorites"}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-slate-600 line-clamp-3 flex-1">
          {category.description || "Support organizations in this cause area."}
        </p>

        <div className="mt-4 flex items-center gap-2">
          {/* Toggle Donate Button - adds to or removes from draft */}
          <div className="relative group/btn flex-1">
            <Button
              size="sm"
              className={`w-full ${inDraft ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              onClick={handleToggleDonate}
            >
              {inDraft ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Added
                </>
              ) : (
                "Donate"
              )}
            </Button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
              {inDraft ? "Remove from donation" : "Donate to this cause"}
            </span>
          </div>
          {onViewOrgs && nonprofitCount > 0 && (
            <div className="relative group/btn">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewOrgs(category.id)}
                className="h-9 px-3 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer"
              >
                <Building2 className="h-4 w-4 mr-1.5" />
                <span className="text-xs">{nonprofitCount}</span>
              </Button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
                View nonprofits
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
