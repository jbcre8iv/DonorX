"use client";

import * as React from "react";
import Link from "next/link";
import { Globe, Eye, Heart, Check, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import type { Nonprofit } from "@/types/database";

type SortOption = "name-asc" | "name-desc" | "category" | "recent";

interface NonprofitTableProps {
  nonprofits: Nonprofit[];
  onQuickView?: (nonprofit: Nonprofit) => void;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

// Action buttons component - defined outside to avoid recreating during render
function ActionButtons({
  className = "",
  nonprofit,
  inDraft,
  hasDraft,
  favorited,
  isLoggedIn,
  onToggleDonate,
  onToggleFavorite,
  onQuickView,
  isMobile = false,
}: {
  className?: string;
  nonprofit: Nonprofit;
  inDraft: boolean;
  hasDraft: boolean;
  favorited: boolean;
  isLoggedIn: boolean;
  onToggleDonate: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onQuickView?: (nonprofit: Nonprofit) => void;
  isMobile?: boolean;
}) {
  return (
    <div className={`flex items-center ${isMobile ? "gap-2" : "gap-1"} ${className}`}>
      {/* Toggle Donate Button - adds to or removes from draft */}
      <div className="relative group/tip">
        <Button
          size="sm"
          className={`${isMobile ? "h-10 px-6" : "h-8"} ${inDraft ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
          onClick={onToggleDonate}
        >
          {inDraft ? (
            <>
              <Check className={`${isMobile ? "h-4 w-4" : "h-3.5 w-3.5"} mr-1.5`} />
              Added
            </>
          ) : (
            "Donate"
          )}
        </Button>
        <span className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
          {inDraft ? "Remove from donation" : "Add to donation"}
        </span>
      </div>
      {/* Quick View - Learn more */}
      {onQuickView && (
        <div className="relative group/tip">
          <Button
            variant="outline"
            size="sm"
            className={`${isMobile ? "h-10 w-10" : "h-9 w-9"} p-0 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer`}
            onClick={() => onQuickView(nonprofit)}
          >
            <Eye className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          </Button>
          <span className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
            Quick View
          </span>
        </div>
      )}
      {/* 4. Website - External link */}
      <div className={`${isMobile ? "w-10 h-10" : "w-9 h-9"} flex items-center justify-center`}>
        {nonprofit.website && (
          <div className="relative group/tip">
            <Button variant="outline" size="sm" className={`${isMobile ? "h-10 w-10" : "h-9 w-9"} p-0 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer`} asChild>
              <a
                href={nonprofit.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              </a>
            </Button>
            <span className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
              Visit Website
            </span>
          </div>
        )}
      </div>
      {/* 5. Favorite - Passive "save for later" action */}
      <div className="relative group/tip">
        <button
          onClick={onToggleFavorite}
          className={`${isMobile ? "h-10 w-10" : "h-9 w-9"} flex items-center justify-center rounded-xl border transition-all ${
            !isLoggedIn
              ? "text-slate-300 border-slate-200 bg-slate-50 cursor-pointer"
              : favorited
              ? "text-pink-500 bg-pink-50 border-pink-200 hover:bg-pink-100 hover:shadow-md cursor-pointer"
              : "text-slate-600 border-slate-200 bg-white hover:text-pink-500 hover:border-pink-300 hover:bg-pink-50 hover:shadow-md cursor-pointer"
          }`}
        >
          <Heart className={`${isMobile ? "h-5 w-5" : "h-4 w-4"} ${favorited ? "fill-current" : ""}`} />
        </button>
        <span className="hidden sm:block absolute bottom-full right-0 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
          {!isLoggedIn ? "Sign in to save favorites" : favorited ? "Remove from favorites" : "Add to favorites"}
        </span>
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
  const { toggleFavorite, isFavorite, hasDraft, addToDraft, removeFromDraft, isInDraft, userId } = useCartFavorites();
  const { addToast } = useToast();
  const isLoggedIn = !!userId;

  const inDraft = isInDraft(nonprofit.id);
  const favorited = isFavorite(nonprofit.id);

  // Toggle donate handler - adds to draft or removes if already in draft
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
    <>
      <tr
        className={`text-sm transition-colors sm:cursor-default cursor-pointer ${
          isExpanded
            ? "sm:hover:bg-slate-50"
            : "hover:bg-slate-50"
        }`}
        onClick={() => {
          // On mobile, clicking the row expands/collapses
          if (window.innerWidth < 640) {
            onToggleExpand();
          }
        }}
      >
        <td className={`py-3 pl-3 pr-2 sm:pr-4 ${isExpanded ? "sm:bg-transparent bg-blue-100/50 border-t-2 border-l-2 border-blue-200 rounded-tl-xl" : ""}`}>
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
        <td className="py-3 pr-6 hidden sm:table-cell rounded-r-lg">
          <ActionButtons
            className="justify-end"
            nonprofit={nonprofit}
            inDraft={inDraft}
            hasDraft={hasDraft}
            favorited={favorited}
            isLoggedIn={isLoggedIn}
            onToggleDonate={handleToggleDonate}
            onToggleFavorite={handleToggleFavorite}
            onQuickView={onQuickView}
          />
        </td>
        {/* Mobile expand/status indicator */}
        <td className={`py-3 sm:hidden ${isExpanded ? "bg-blue-100/50 border-t-2 border-r-2 border-blue-200 rounded-tr-xl" : ""}`}>
          <div className="flex items-center">
            {/* Fixed-width container for indicator - keeps chevron aligned */}
            <div className="w-5 flex items-center justify-center">
              {inDraft && !isExpanded && (
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                </span>
              )}
            </div>
            <button
              onClick={onToggleExpand}
              className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label={isExpanded ? "Hide actions" : "Show actions"}
            >
              <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </td>
      </tr>
      {/* Mobile expanded actions row */}
      {isExpanded && (
        <tr className="sm:hidden">
          <td colSpan={2} className="py-3 px-4 bg-blue-100/50 border-b-2 border-l-2 border-r-2 border-blue-200 rounded-b-xl">
            <ActionButtons
              className="justify-center flex-wrap"
              nonprofit={nonprofit}
              inDraft={inDraft}
              hasDraft={hasDraft}
              favorited={favorited}
              isLoggedIn={isLoggedIn}
              onToggleDonate={handleToggleDonate}
              onToggleFavorite={handleToggleFavorite}
              onQuickView={onQuickView}
              isMobile={true}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function NonprofitTable({ nonprofits, onQuickView, sortBy, onSortChange }: NonprofitTableProps) {
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

  const handleNameSort = () => {
    if (!onSortChange) return;
    onSortChange(sortBy === "name-asc" ? "name-desc" : "name-asc");
  };

  const handleCategorySort = () => {
    if (!onSortChange) return;
    onSortChange("category");
  };

  const renderSortIcon = (column: "name" | "category") => {
    if (!onSortChange) return null;

    const isNameSort = column === "name" && (sortBy === "name-asc" || sortBy === "name-desc");
    const isCategorySort = column === "category" && sortBy === "category";

    if (isNameSort) {
      return sortBy === "name-asc"
        ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
        : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />;
    }
    if (isCategorySort) {
      return <ArrowUp className="h-3.5 w-3.5 text-blue-600" />;
    }
    return null;
  };

  return (
    <div className="sm:overflow-x-auto overflow-visible">
      <table className="w-full table-fixed sm:table-auto">
        <thead>
          <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
            <th className="pb-3 pl-3 font-medium">
              {onSortChange ? (
                <button
                  onClick={handleNameSort}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                >
                  Organization
                  {renderSortIcon("name")}
                </button>
              ) : (
                "Organization"
              )}
            </th>
            <th className="pb-3 font-medium hidden sm:table-cell">
              {onSortChange ? (
                <button
                  onClick={handleCategorySort}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                >
                  Category
                  {renderSortIcon("category")}
                </button>
              ) : (
                "Category"
              )}
            </th>
            <th className="pb-3 font-medium hidden lg:table-cell">Mission</th>
            <th className="pb-3 pr-6 font-medium text-right hidden sm:table-cell">Actions</th>
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
