"use client";

import * as React from "react";
import Link from "next/link";
import { Globe, Eye, Heart, HandHeart, Check, Plus, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import type { Nonprofit } from "@/types/database";

interface NonprofitTableProps {
  nonprofits: Nonprofit[];
  onQuickView?: (nonprofit: Nonprofit) => void;
}

function NonprofitRow({ nonprofit, onQuickView }: { nonprofit: Nonprofit; onQuickView?: (nonprofit: Nonprofit) => void }) {
  const { addToCart, isInCart, toggleFavorite, isFavorite } = useCartFavorites();
  const [expanded, setExpanded] = React.useState(false);

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
      // Don't open sidebar - let the header icon animation indicate the item was added
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

  // Shared action buttons component
  const ActionButtons = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button asChild size="sm" className="h-8">
        <Link href={`/donate?nonprofit=${nonprofit.id}`}>Donate</Link>
      </Button>
      <Button
        variant={inCart ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={handleAddToCart}
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
      <button
        onClick={handleToggleFavorite}
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

  return (
    <>
      <tr className="text-sm hover:bg-slate-50 transition-colors">
        <td className="py-3 pr-4">
          <Link href={`/directory/${nonprofit.id}`} className="flex items-center gap-3 group">
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
            <div className="min-w-0">
              <span className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                {nonprofit.name}
              </span>
              {nonprofit.ein && (
                <p className="text-xs text-slate-400">EIN: {nonprofit.ein}</p>
              )}
              {/* Show category on mobile */}
              {nonprofit.category && (
                <Badge variant="secondary" className="mt-1 sm:hidden text-xs">
                  {nonprofit.category.icon && (
                    <span className="mr-1">{nonprofit.category.icon}</span>
                  )}
                  {nonprofit.category.name}
                </Badge>
              )}
            </div>
          </Link>
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
          <ActionButtons className="justify-end" />
        </td>
        {/* Mobile expand button */}
        <td className="py-3 sm:hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label={expanded ? "Hide actions" : "Show actions"}
          >
            <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </td>
      </tr>
      {/* Mobile expanded actions row */}
      {expanded && (
        <tr className="sm:hidden bg-slate-50">
          <td colSpan={2} className="py-3 px-4">
            <ActionButtons className="justify-start flex-wrap" />
          </td>
        </tr>
      )}
    </>
  );
}

export function NonprofitTable({ nonprofits, onQuickView }: NonprofitTableProps) {
  if (nonprofits.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No nonprofits found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
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
            <NonprofitRow key={nonprofit.id} nonprofit={nonprofit} onQuickView={onQuickView} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
