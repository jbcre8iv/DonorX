"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Trash2, Tag, Building2, Plus, Eye, X, Globe } from "lucide-react";
import { useCartFavorites, type FavoriteItem } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function FavoritesTab() {
  const {
    favorites,
    removeFromFavorites,
    addToCart,
    isInCart,
    setSidebarOpen,
    setActiveTab,
  } = useCartFavorites();
  const { addToast } = useToast();

  const [quickViewItem, setQuickViewItem] = useState<FavoriteItem | null>(null);

  const handleAddToCart = async (item: typeof favorites[0]) => {
    const result = await addToCart({
      nonprofitId: item.nonprofitId,
      categoryId: item.categoryId,
      nonprofit: item.nonprofit,
      category: item.category,
    });

    if (!result.success) {
      if (result.reason === "blocked_by_draft") {
        addToast("You have an active donation in progress. Continue or clear it first.", "warning", 5000);
        setActiveTab("cart"); // Switch to cart tab to show the active donation banner
      } else if (result.reason === "cart_full") {
        addToast("Your giving list is full (max 10 items).", "warning");
      }
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-pink-50 p-4">
          <Heart className="h-8 w-8 text-pink-300" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-slate-900">
          No favorites yet
        </h3>
        <p className="mb-6 text-sm text-slate-500">
          Save your favorite nonprofits and categories for quick access later.
        </p>
        <Link href="/directory" onClick={() => setSidebarOpen(false)}>
          <Button variant="outline">Browse Directory</Button>
        </Link>
      </div>
    );
  }

  // Separate nonprofits and categories
  const nonprofitFavorites = favorites.filter((f) => f.nonprofitId);
  const categoryFavorites = favorites.filter((f) => f.categoryId);

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Nonprofits Section */}
      {nonprofitFavorites.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Building2 className="h-4 w-4" />
            Nonprofits ({nonprofitFavorites.length})
          </h3>
          <div className="space-y-2">
            {nonprofitFavorites.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start gap-3">
                  {/* Logo */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
                    {item.nonprofit?.logoUrl ? (
                      <img
                        src={item.nonprofit.logoUrl}
                        alt={item.nonprofit.name}
                        className="h-10 w-10 rounded-lg object-contain"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-slate-600">
                        {item.nonprofit?.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium text-slate-900">
                      {item.nonprofit?.name}
                    </h4>
                    {item.nonprofit?.mission && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {item.nonprofit.mission}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => setQuickViewItem(item)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="h-3 w-3" />
                    Quick view
                  </button>
                  <div className="flex items-center gap-2">
                    {isInCart(item.nonprofitId) ? (
                      <span className="text-xs text-green-600">In giving list</span>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                      >
                        <Plus className="h-3 w-3" />
                        Add to giving list
                      </button>
                    )}
                    <button
                      onClick={() => removeFromFavorites(item.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Section */}
      {categoryFavorites.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Tag className="h-4 w-4" />
            Categories ({categoryFavorites.length})
          </h3>
          <div className="space-y-2">
            {categoryFavorites.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    {item.category?.icon ? (
                      <span className="text-xl">{item.category.icon}</span>
                    ) : (
                      <Tag className="h-5 w-5 text-slate-400" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium text-slate-900">
                      {item.category?.name}
                    </h4>
                    <p className="text-xs text-slate-500">Category</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isInCart(undefined, item.categoryId) ? (
                      <span className="text-xs text-green-600">In giving list</span>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                      >
                        <Plus className="h-3 w-3" />
                        Add to giving list
                      </button>
                    )}
                    <button
                      onClick={() => removeFromFavorites(item.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View All Link */}
      <div className="mt-6 text-center">
        <Link
          href="/dashboard/favorites"
          onClick={() => setSidebarOpen(false)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View all favorites in dashboard
        </Link>
      </div>

      {/* Quick View Modal */}
      {quickViewItem && quickViewItem.nonprofit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setQuickViewItem(null)}
          />
          {/* Modal */}
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-start gap-4 p-4 border-b border-slate-200">
              {quickViewItem.nonprofit.logoUrl ? (
                <img
                  src={quickViewItem.nonprofit.logoUrl}
                  alt={quickViewItem.nonprofit.name}
                  className="h-14 w-14 rounded-xl object-contain border border-slate-200"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xl">
                  {quickViewItem.nonprofit.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  {quickViewItem.nonprofit.name}
                </h3>
                <p className="text-sm text-slate-500">Nonprofit</p>
              </div>
              <button
                onClick={() => setQuickViewItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              {quickViewItem.nonprofit.mission ? (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Mission</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {quickViewItem.nonprofit.mission}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  No mission statement available.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setQuickViewItem(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="flex-1"
                asChild
              >
                <Link
                  href={`/directory/${quickViewItem.nonprofitId}`}
                  onClick={() => {
                    setQuickViewItem(null);
                    setSidebarOpen(false);
                  }}
                >
                  <Globe className="h-4 w-4 mr-1" />
                  Full Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
