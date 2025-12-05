"use client";

import * as React from "react";
import Link from "next/link";
import { HandHeart, Check, Plus, ChevronDown, CreditCard, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import type { Category } from "@/types/database";

type SortOption = "name-asc" | "name-desc" | "category" | "recent";

interface CategoryTableProps {
  categories: Category[];
  nonprofitCounts: Record<string, number>;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

function CategoryRow({
  category,
  nonprofitCount,
  isExpanded,
  onToggleExpand,
}: {
  category: Category;
  nonprofitCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const { addToCart, isInCart, hasDraft, addToDraft, isInDraft } = useCartFavorites();
  const { addToast } = useToast();

  const inCart = isInCart(undefined, category.id);
  const inDraft = isInDraft(undefined, category.id);

  const handleAddToCartOrDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If there's an active draft, add directly to the draft allocations
    if (hasDraft) {
      if (!inDraft) {
        await addToDraft({
          type: "category",
          targetId: category.id,
          targetName: category.name,
        });
        addToast(`Added ${category.name} category to your donation`, "success", 3000);
      }
      return;
    }

    // Otherwise, add to cart
    if (!inCart) {
      const result = await addToCart({
        categoryId: category.id,
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon || undefined,
        },
      });

      if (!result.success) {
        if (result.reason === "cart_full") {
          addToast("Your giving list is full (max 10 items).", "warning");
        }
      }
    }
  };

  return (
    <>
      <tr
        className={`text-sm transition-colors sm:cursor-default cursor-pointer ${
          isExpanded
            ? "sm:hover:bg-slate-50 bg-blue-50 shadow-[inset_0_0_0_2px_rgb(147,197,253)]"
            : "hover:bg-slate-50"
        }`}
        onClick={() => {
          // On mobile, clicking the row expands/collapses
          if (window.innerWidth < 640) {
            onToggleExpand();
          }
        }}
      >
        <td className="py-3 pl-3 pr-2 sm:pr-4">
          {/* Desktop: Link to filtered directory */}
          <Link
            href={`/directory?category=${category.slug}`}
            className="hidden sm:flex items-center gap-3 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg flex-shrink-0">
              {category.icon || "📁"}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors block truncate">
                {category.name}
              </span>
              <p className="text-xs text-slate-400 truncate">
                {nonprofitCount} nonprofit{nonprofitCount !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>
          {/* Mobile: Non-link content (row click handles expand) */}
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg flex-shrink-0">
              {category.icon || "📁"}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="font-medium text-slate-900 block truncate">
                {category.name}
              </span>
              <p className="text-xs text-slate-400 truncate">
                {nonprofitCount} nonprofit{nonprofitCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </td>
        <td className="py-3 pr-4 hidden lg:table-cell">
          <p className="text-slate-600 line-clamp-2 max-w-md">
            {category.description || "No description"}
          </p>
        </td>
        {/* Desktop actions - hidden on mobile */}
        <td className="py-3 pr-6 hidden sm:table-cell rounded-r-lg">
          <div className="flex items-center gap-1 justify-end">
            {/* Donate to category */}
            <Button asChild size="sm" className="h-8">
              <Link href={`/donate?category=${category.id}`}>Donate</Link>
            </Button>
            {/* Add to donation/cart */}
            {hasDraft ? (
              <div className="relative group/tip">
                <Button
                  variant={inDraft ? "secondary" : "outline"}
                  size="sm"
                  className={`h-9 w-9 p-0 rounded-xl cursor-pointer ${!inDraft ? "text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md" : ""}`}
                  onClick={handleAddToCartOrDraft}
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
                <span className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
                  {inDraft ? "In donation" : "Add to donation"}
                </span>
              </div>
            ) : (
              <div className="relative group/tip">
                <Button
                  variant={inCart ? "secondary" : "outline"}
                  size="sm"
                  className={`h-9 w-9 p-0 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer`}
                  onClick={handleAddToCartOrDraft}
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
                <span className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
                  {inCart ? "In giving list" : "Add to giving list"}
                </span>
              </div>
            )}
            {/* View nonprofits in category */}
            <div className="relative group/tip">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer"
                asChild
              >
                <Link href={`/directory?category=${category.slug}`}>
                  View Orgs
                </Link>
              </Button>
              <span className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
                View nonprofits in this category
              </span>
            </div>
          </div>
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
        <tr className="sm:hidden bg-blue-50 shadow-[inset_0_0_0_2px_rgb(147,197,253)]">
          <td colSpan={2} className="py-3 px-4">
            <div className="flex items-center gap-2 justify-center flex-wrap">
              {/* Donate to category */}
              <Button asChild size="sm" className="h-10 px-10">
                <Link href={`/donate?category=${category.id}`}>Donate</Link>
              </Button>
              {/* Add to donation/cart */}
              {hasDraft ? (
                <Button
                  variant={inDraft ? "secondary" : "outline"}
                  size="sm"
                  className={`h-10 w-10 p-0 rounded-xl cursor-pointer ${!inDraft ? "text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md" : ""}`}
                  onClick={handleAddToCartOrDraft}
                  disabled={inDraft}
                >
                  {inDraft ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Plus className="h-3.5 w-3.5" />
                      <CreditCard className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              ) : (
                <Button
                  variant={inCart ? "secondary" : "outline"}
                  size="sm"
                  className={`h-10 w-10 p-0 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer`}
                  onClick={handleAddToCartOrDraft}
                  disabled={inCart}
                >
                  {inCart ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Plus className="h-3.5 w-3.5" />
                      <HandHeart className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              )}
              {/* View nonprofits */}
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl"
                asChild
              >
                <Link href={`/directory?category=${category.slug}`}>
                  View Orgs
                </Link>
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function CategoryTable({ categories, nonprofitCounts, sortBy, onSortChange }: CategoryTableProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No categories found.</p>
      </div>
    );
  }

  const handleToggleExpand = (categoryId: string) => {
    setExpandedId(expandedId === categoryId ? null : categoryId);
  };

  const handleNameSort = () => {
    if (!onSortChange) return;
    onSortChange(sortBy === "name-asc" ? "name-desc" : "name-asc");
  };

  const renderSortIcon = () => {
    if (!onSortChange) return null;
    const isNameSort = sortBy === "name-asc" || sortBy === "name-desc";
    if (isNameSort) {
      return sortBy === "name-asc"
        ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
        : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />;
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
                  Category
                  {renderSortIcon()}
                </button>
              ) : (
                "Category"
              )}
            </th>
            <th className="pb-3 font-medium hidden lg:table-cell">Description</th>
            <th className="pb-3 pr-6 font-medium text-right hidden sm:table-cell">Actions</th>
            <th className="pb-3 sm:hidden w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              nonprofitCount={nonprofitCounts[category.id] || 0}
              isExpanded={expandedId === category.id}
              onToggleExpand={() => handleToggleExpand(category.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
