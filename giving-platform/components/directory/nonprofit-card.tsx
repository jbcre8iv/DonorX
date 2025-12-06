"use client";

import Link from "next/link";
import { Globe, Eye, Heart, Check } from "lucide-react";
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
  const { toggleFavorite, isFavorite, hasDraft, addToDraft, removeFromDraft, isInDraft, userId } = useCartFavorites();
  const { addToast } = useToast();
  const isLoggedIn = !!userId;

  const inDraft = isInDraft(nonprofit.id);
  const favorited = isFavorite(nonprofit.id);

  // Toggle donate handler - adds to or removes from draft
  const handleToggleDonate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inDraft) {
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
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If not logged in, show a subtle reminder with sign in link
    if (!isLoggedIn) {
      addToast("Sign in to save favorites", "info", 4000, {
        label: "Sign in",
        href: "/login?redirect=/directory",
      });
      return;
    }

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
            <div className="relative group/fav">
              <button
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
          {nonprofit.mission || nonprofit.description || "No description available."}
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
              {inDraft ? "Remove from donation" : "Add to donation"}
            </span>
          </div>
          {onQuickView && (
            <div className="relative group/btn">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickView(nonprofit)}
                className="h-9 w-9 p-0 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
                Quick View
              </span>
            </div>
          )}
          {nonprofit.website && (
            <div className="relative group/btn">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer" asChild>
                <a
                  href={nonprofit.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="h-4 w-4" />
                </a>
              </Button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
                Visit Website
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
