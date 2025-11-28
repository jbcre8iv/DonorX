"use client";

import Link from "next/link";
import { ExternalLink, Eye, Heart, ShoppingCart, Check, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import type { Nonprofit } from "@/types/database";

interface NonprofitCardProps {
  nonprofit: Nonprofit;
  onQuickView?: (nonprofit: Nonprofit) => void;
}

export function NonprofitCard({ nonprofit, onQuickView }: NonprofitCardProps) {
  const { addToCart, isInCart, toggleFavorite, isFavorite, setSidebarOpen, setActiveTab } = useCartFavorites();

  const inCart = isInCart(nonprofit.id);
  const favorited = isFavorite(nonprofit.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) {
      await addToCart({
        nonprofitId: nonprofit.id,
        nonprofit: {
          id: nonprofit.id,
          name: nonprofit.name,
          logoUrl: nonprofit.logo_url || undefined,
          mission: nonprofit.mission || undefined,
        },
      });
      // Open sidebar to show the added item
      setActiveTab("cart");
      setSidebarOpen(true);
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
          <Button
            variant={inCart ? "secondary" : "outline"}
            size="sm"
            onClick={handleAddToCart}
            title={inCart ? "Already in cart" : "Add to cart"}
            disabled={inCart}
          >
            {inCart ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="relative">
                <ShoppingCart className="h-4 w-4" />
                <Plus className="h-2.5 w-2.5 absolute -top-1 -right-1 stroke-[3]" />
              </span>
            )}
          </Button>
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
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
