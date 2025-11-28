"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Trash2,
  Tag,
  Building2,
  Plus,
  ExternalLink,
  HandHeart,
  ArrowRight,
} from "lucide-react";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FavoritesPage() {
  const {
    favorites,
    removeFromFavorites,
    addToCart,
    isInCart,
    setSidebarOpen,
    setActiveTab,
    isLoading,
  } = useCartFavorites();

  const handleAddToCart = async (item: (typeof favorites)[0]) => {
    await addToCart({
      nonprofitId: item.nonprofitId,
      categoryId: item.categoryId,
      nonprofit: item.nonprofit,
      category: item.category,
    });
    setActiveTab("cart");
    setSidebarOpen(true);
  };

  const nonprofitFavorites = favorites.filter((f) => f.nonprofitId);
  const categoryFavorites = favorites.filter((f) => f.categoryId);

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
    <div className="space-y-8">
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
              <Card key={item.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Logo */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      {item.nonprofit?.logoUrl ? (
                        <Image
                          src={item.nonprofit.logoUrl}
                          alt={item.nonprofit.name}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 group-hover:text-blue-700">
                        <Link href={`/directory/${item.nonprofitId}`}>
                          {item.nonprofit?.name}
                        </Link>
                      </h3>
                      {item.nonprofit?.mission && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {item.nonprofit.mission}
                        </p>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromFavorites(item.id)}
                      className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/donate?nonprofit=${item.nonprofitId}`}>
                        Donate
                      </Link>
                    </Button>
                    {isInCart(item.nonprofitId) ? (
                      <Button variant="secondary" size="sm" disabled>
                        In List
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/directory/${item.nonprofitId}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
            {categoryFavorites.map((item) => (
              <Card key={item.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      {item.category?.icon ? (
                        <span className="text-2xl">{item.category.icon}</span>
                      ) : (
                        <Tag className="h-6 w-6 text-slate-400" />
                      )}
                    </div>

                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900">
                        {item.category?.name}
                      </h3>
                      <p className="text-sm text-slate-500">Category</p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromFavorites(item.id)}
                      className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/donate?category=${item.categoryId}`}>
                        Donate to Category
                      </Link>
                    </Button>
                    {isInCart(undefined, item.categoryId) ? (
                      <Button variant="secondary" size="sm" disabled>
                        In List
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
