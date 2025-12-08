"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Heart,
  Tag,
  Building2,
  HandHeart,
  ArrowRight,
  Check,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import { usePreferences } from "@/hooks/use-preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NonprofitCard } from "@/components/directory/nonprofit-card";
import { NonprofitTable } from "@/components/directory/nonprofit-table";
import { NonprofitModal } from "@/components/directory/nonprofit-modal";
import type { Nonprofit } from "@/types/database";

type SortOption = "name-asc" | "name-desc" | "category" | "recent";

const SORT_OPTIONS: { value: SortOption; label: string; shortLabel: string }[] = [
  { value: "name-asc", label: "Name (A-Z)", shortLabel: "A-Z" },
  { value: "name-desc", label: "Name (Z-A)", shortLabel: "Z-A" },
  { value: "recent", label: "Recently Added", shortLabel: "Recent" },
];

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
  const { preferences, setPreference } = usePreferences();

  // Local state for search, sort, and view mode
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [selectedNonprofit, setSelectedNonprofit] = useState<Nonprofit | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // View mode - default based on screen size (computed once on mount)
  const defaultViewMode = typeof window !== "undefined" && window.innerWidth < 640 ? "table" : "grid";

  const viewMode = preferences.favorites_view_mode || defaultViewMode;
  const setViewMode = (mode: "grid" | "table") => {
    setPreference("favorites_view_mode", mode);
  };

  const handleQuickView = (nonprofit: Nonprofit) => {
    setSelectedNonprofit(nonprofit);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedNonprofit(null);
  };

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

  // Transform favorites to Nonprofit type for NonprofitCard/NonprofitTable
  const transformToNonprofit = (item: (typeof favorites)[0]): Nonprofit => ({
    id: item.nonprofitId || "",
    name: item.nonprofit?.name || "Unknown",
    ein: null,
    mission: item.nonprofit?.mission || null,
    description: null,
    logo_url: item.nonprofit?.logoUrl || null,
    website: item.nonprofit?.website || null,
    category_id: null,
    status: "approved" as const,
    featured: false,
    created_at: item.createdAt || new Date().toISOString(),
    approved_at: null,
  });

  // Filter nonprofits by search
  const filteredNonprofitFavorites = useMemo(() => {
    if (!search.trim()) return nonprofitFavorites;
    const searchLower = search.toLowerCase();
    return nonprofitFavorites.filter((item) =>
      item.nonprofit?.name?.toLowerCase().includes(searchLower) ||
      item.nonprofit?.mission?.toLowerCase().includes(searchLower)
    );
  }, [nonprofitFavorites, search]);

  // Filter categories by search
  const filteredCategoryFavorites = useMemo(() => {
    if (!search.trim()) return categoryFavorites;
    const searchLower = search.toLowerCase();
    return categoryFavorites.filter((item) =>
      item.category?.name?.toLowerCase().includes(searchLower)
    );
  }, [categoryFavorites, search]);

  // Sort nonprofits
  const sortedNonprofitFavorites = useMemo(() => {
    const sorted = [...filteredNonprofitFavorites];
    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) =>
          (a.nonprofit?.name || "").localeCompare(b.nonprofit?.name || "")
        );
      case "name-desc":
        return sorted.sort((a, b) =>
          (b.nonprofit?.name || "").localeCompare(a.nonprofit?.name || "")
        );
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      default:
        return sorted;
    }
  }, [filteredNonprofitFavorites, sortBy]);

  // Sort categories
  const sortedCategoryFavorites = useMemo(() => {
    const sorted = [...filteredCategoryFavorites];
    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) =>
          (a.category?.name || "").localeCompare(b.category?.name || "")
        );
      case "name-desc":
        return sorted.sort((a, b) =>
          (b.category?.name || "").localeCompare(a.category?.name || "")
        );
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      default:
        return sorted;
    }
  }, [filteredCategoryFavorites, sortBy]);

  // Transform for table/card components
  const transformedNonprofits = sortedNonprofitFavorites.map(transformToNonprofit);

  const totalFiltered = filteredNonprofitFavorites.length + filteredCategoryFavorites.length;

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
    <div className={`space-y-6 transition-all duration-300 ${isSidebarOpen ? "lg:mr-[400px]" : ""}`}>
      {/* Header */}
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

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search favorites..."
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Clear search"
            >
              <span className="text-xs font-medium">×</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort Dropdown - only in grid view */}
          {viewMode === "grid" && (
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              {/* Mobile: short labels */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="sm:hidden flex h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-10 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-0"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.shortLabel}
                  </option>
                ))}
              </select>
              {/* Desktop: full labels */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="hidden sm:flex h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-10 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-0"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-slate-500">
          Showing {totalFiltered} result{totalFiltered !== 1 ? "s" : ""}
        </p>
      )}

      {/* Content */}
      {totalFiltered === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No favorites match your search.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Nonprofits Section */}
          {sortedNonprofitFavorites.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
                <Building2 className="h-5 w-5" />
                Nonprofits ({sortedNonprofitFavorites.length})
              </h2>
              {viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedNonprofitFavorites.map((item) => (
                    <NonprofitCard
                      key={item.id}
                      nonprofit={transformToNonprofit(item)}
                      onQuickView={handleQuickView}
                    />
                  ))}
                </div>
              ) : (
                <NonprofitTable
                  nonprofits={transformedNonprofits}
                  onQuickView={handleQuickView}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  hideCategory
                />
              )}
            </div>
          )}

          {/* Categories Section */}
          {sortedCategoryFavorites.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
                <Tag className="h-5 w-5" />
                Categories ({sortedCategoryFavorites.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedCategoryFavorites.map((item) => {
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
      )}

      {/* Quick View Modal */}
      <NonprofitModal
        nonprofit={selectedNonprofit}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
