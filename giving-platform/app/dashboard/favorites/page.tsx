"use client";

import Link from "next/link";
import {
  Heart,
  Tag,
  Building2,
  HandHeart,
  ArrowRight,
  Check,
} from "lucide-react";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NonprofitCard } from "@/components/directory/nonprofit-card";
import type { Nonprofit } from "@/types/database";

export default function FavoritesPage() {
  const {
    favorites,
    removeFromFavorites,
    addToDraft,
    removeFromDraft,
    isInDraft,
    setSidebarOpen,
    setActiveTab,
    isLoading,
    isSidebarOpen,
  } = useCartFavorites();
  const { addToast } = useToast();

  const handleToggleDonate = async (item: (typeof favorites)[0]) => {
    const targetId = item.nonprofitId || item.categoryId;
    const targetName = item.nonprofit?.name || item.category?.name || "Unknown";
    const type = item.nonprofitId ? "nonprofit" : "category";
    const inDraft = isInDraft(item.nonprofitId, item.categoryId);

    if (inDraft && targetId) {
      await removeFromDraft(targetId);
      addToast(`Removed ${targetName} from your donation`, "info", 3000);
    } else if (targetId) {
      await addToDraft({
        type: type as "nonprofit" | "category",
        targetId,
        targetName,
        logoUrl: item.nonprofit?.logoUrl,
        icon: item.category?.icon,
      });
      addToast(`Added ${targetName} to your donation`, "success", 3000);
    }
  };

  const nonprofitFavorites = favorites.filter((f) => f.nonprofitId);
  const categoryFavorites = favorites.filter((f) => f.categoryId);

  // Transform favorites to Nonprofit type for NonprofitCard
  const transformToNonprofit = (item: (typeof favorites)[0]): Nonprofit => ({
    id: item.nonprofitId || "",
    name: item.nonprofit?.name || "Unknown",
    ein: null,
    mission: item.nonprofit?.mission || null,
    description: null,
    logo_url: item.nonprofit?.logoUrl || null,
    website: null,
    category_id: null,
    status: "approved" as const,
    featured: false,
    created_at: item.createdAt || new Date().toISOString(),
    approved_at: null,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Favorites</h1>
          <p className="text-slate-600">Loading your saved items...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-slate-200" />
                <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Favorites</h1>
          <p className="text-slate-600">
            Your saved nonprofits and categories will appear here.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-pink-50 p-4">
              <Heart className="h-10 w-10 text-pink-300" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              No favorites yet
            </h2>
            <p className="mb-6 max-w-md text-slate-500">
              Browse the directory and click the heart icon on nonprofits or
              categories you want to save for later.
            </p>
            <Button asChild>
              <Link href="/directory">
                Browse Directory
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-8 transition-all duration-300 ${isSidebarOpen ? "lg:mr-[400px]" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Favorites</h1>
          <p className="text-slate-600">
            {favorites.length} saved item{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setActiveTab("favorites");
            setSidebarOpen(true);
          }}
        >
          <HandHeart className="mr-2 h-4 w-4" />
          Open Giving List
        </Button>
      </div>

      {/* Nonprofits Section */}
      {nonprofitFavorites.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
            <Building2 className="h-5 w-5" />
            Nonprofits ({nonprofitFavorites.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nonprofitFavorites.map((item) => (
              <NonprofitCard
                key={item.id}
                nonprofit={transformToNonprofit(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Categories Section */}
      {categoryFavorites.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
            <Tag className="h-5 w-5" />
            Categories ({categoryFavorites.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryFavorites.map((item) => {
              const inDraft = isInDraft(undefined, item.categoryId);
              return (
                <Card key={item.id} className="flex flex-col h-full group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl flex-shrink-0">
                          {item.category?.icon || <Tag className="h-6 w-6 text-slate-400" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 line-clamp-1">
                            {item.category?.name}
                          </h3>
                          <p className="text-sm text-slate-500">Category</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromFavorites(item.id)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl border text-pink-500 bg-pink-50 border-pink-200 hover:bg-pink-100 hover:shadow-md transition-all cursor-pointer flex-shrink-0"
                        title="Remove from favorites"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-slate-600 flex-1">
                      Donate to any nonprofit in this category.
                    </p>

                    <div className="mt-4">
                      <Button
                        size="sm"
                        className={`w-full ${inDraft ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                        onClick={() => handleToggleDonate(item)}
                      >
                        {inDraft ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Added
                          </>
                        ) : (
                          "Donate to Category"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
