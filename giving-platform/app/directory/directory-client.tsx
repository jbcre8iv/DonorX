"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search, LayoutGrid, List, ChevronDown, ArrowUpDown, Building2, Tags } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { NonprofitCard } from "@/components/directory/nonprofit-card";
import { NonprofitTable } from "@/components/directory/nonprofit-table";
import { CategoryTable } from "@/components/directory/category-table";
import { NonprofitModal } from "@/components/directory/nonprofit-modal";
import { usePreferences } from "@/hooks/use-preferences";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { smartFilterNonprofit } from "@/lib/smart-search";
import type { Nonprofit, Category } from "@/types/database";

const ITEMS_PER_PAGE_GRID = 9;
const ITEMS_PER_PAGE_TABLE = 25;

type SortOption = "name-asc" | "name-desc" | "category" | "recent";
type BrowseMode = "nonprofits" | "categories";

const SORT_OPTIONS: { value: SortOption; label: string; shortLabel: string }[] = [
  { value: "name-asc", label: "Name (A-Z)", shortLabel: "A-Z" },
  { value: "name-desc", label: "Name (Z-A)", shortLabel: "Z-A" },
  { value: "category", label: "Category", shortLabel: "Category" },
  { value: "recent", label: "Recently Added", shortLabel: "Recent" },
];

interface DirectoryClientProps {
  initialNonprofits: Nonprofit[];
  categories: Category[];
}

export function DirectoryClient({
  initialNonprofits,
  categories,
}: DirectoryClientProps) {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const { preferences, setPreference, loading: preferencesLoading } = usePreferences();
  const { isSidebarOpen } = useCartFavorites();

  // Find category ID from slug in URL
  const matchedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;
  const initialCategoryId = matchedCategory?.id || null;

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    initialCategoryId
  );
  const [sortBy, setSortBy] = React.useState<SortOption>("name-asc");
  const [selectedNonprofit, setSelectedNonprofit] = React.useState<Nonprofit | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [browseMode, setBrowseMode] = React.useState<BrowseMode>("nonprofits");

  // View mode is now managed by preferences hook
  const viewMode = preferences.directory_view_mode || "grid";
  const setViewMode = (mode: "grid" | "table") => {
    setPreference("directory_view_mode", mode);
  };

  const handleQuickView = (nonprofit: Nonprofit) => {
    setSelectedNonprofit(nonprofit);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedNonprofit(null);
  };

  // Handle "View Orgs" click from category table - switch to nonprofits view with category filter
  const handleViewOrgsFromCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setBrowseMode("nonprofits");
    // Scroll to top after switching views
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Update selected category when URL changes
  React.useEffect(() => {
    setSelectedCategory(initialCategoryId);
  }, [initialCategoryId]);

  // Reset to page 1 when filters, sort, view mode, or browse mode change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, sortBy, viewMode, browseMode]);

  // First filter by search only (to determine which categories to show)
  const searchFilteredNonprofits = initialNonprofits.filter((nonprofit) =>
    smartFilterNonprofit(nonprofit, search)
  );

  // Get category IDs that have matching nonprofits
  const relevantCategoryIds = React.useMemo(() => {
    const ids = new Set<string>();
    searchFilteredNonprofits.forEach((n) => {
      if (n.category_id) ids.add(n.category_id);
    });
    return ids;
  }, [searchFilteredNonprofits]);

  // Filter categories to only show relevant ones when searching
  const filteredCategories = React.useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter((c) => relevantCategoryIds.has(c.id));
  }, [categories, search, relevantCategoryIds]);

  // Reset category selection if the selected category is no longer relevant
  React.useEffect(() => {
    if (search.trim() && selectedCategory && !relevantCategoryIds.has(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [search, selectedCategory, relevantCategoryIds]);

  // Then apply category filter for final results
  const categoryFilteredNonprofits = searchFilteredNonprofits.filter((nonprofit) => {
    return selectedCategory === null || nonprofit.category_id === selectedCategory;
  });

  // Apply sorting
  const filteredNonprofits = React.useMemo(() => {
    const sorted = [...categoryFilteredNonprofits];
    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "category":
        return sorted.sort((a, b) => {
          const catA = a.category?.name || "";
          const catB = b.category?.name || "";
          if (catA === catB) return a.name.localeCompare(b.name);
          return catA.localeCompare(catB);
        });
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Most recent first
        });
      default:
        return sorted;
    }
  }, [categoryFilteredNonprofits, sortBy]);

  // Featured section disabled - all nonprofits shown in single list
  // Database column preserved for future use
  // const featuredNonprofits = filteredNonprofits.filter((n) => n.featured);
  // const otherNonprofits = filteredNonprofits.filter((n) => !n.featured);

  // Filter and sort categories by search (for categories view)
  const filteredCategoriesForView = React.useMemo(() => {
    let filtered = categories;
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = categories.filter((c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    }
    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [categories, search, sortBy]);

  // Get nonprofit count per category
  const nonprofitCountByCategory = React.useMemo(() => {
    const counts: Record<string, number> = {};
    initialNonprofits.forEach((n) => {
      if (n.category_id) {
        counts[n.category_id] = (counts[n.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [initialNonprofits]);

  // Pagination for all nonprofits (more items per page in table view)
  const itemsPerPage = viewMode === "table" ? ITEMS_PER_PAGE_TABLE : ITEMS_PER_PAGE_GRID;
  const totalPages = browseMode === "nonprofits"
    ? Math.ceil(filteredNonprofits.length / itemsPerPage)
    : Math.ceil(filteredCategoriesForView.length / itemsPerPage);
  const paginatedNonprofits = filteredNonprofits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const paginatedCategories = filteredCategoriesForView.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={`py-12 overflow-visible transition-all duration-300 ${isSidebarOpen ? "lg:mr-[28rem]" : ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Nonprofit Directory
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Browse our curated directory of vetted 501(c)(3) organizations
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={browseMode === "nonprofits" ? "Search nonprofits..." : "Search categories..."}
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
            {/* Browse mode toggle - Orgs vs Categories */}
            <div className="flex items-center rounded-lg border border-slate-200 p-1">
              <Button
                variant={browseMode === "nonprofits" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 gap-1"
                onClick={() => setBrowseMode("nonprofits")}
                title="Browse nonprofits"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Orgs</span>
              </Button>
              <Button
                variant={browseMode === "categories" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 gap-1"
                onClick={() => setBrowseMode("categories")}
                title="Browse categories"
              >
                <Tags className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Categories</span>
              </Button>
            </div>
            {/* View mode toggle - Grid vs List */}
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
          </div>

          {/* Filter and Sort - Dropdowns */}
          {/* Show filter row if: nonprofits view (category filter) OR grid view (sort dropdown) */}
          {(browseMode === "nonprofits" || viewMode === "grid") && (
          <div className="flex flex-row gap-3 max-w-xl mx-auto">
            {/* Category Filter - only for nonprofits view */}
            {browseMode === "nonprofits" && (
              <div className="relative flex-[3] sm:flex-1">
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className={`flex h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-0 ${selectedCategory ? "pr-16" : "pr-10"}`}
                >
                  <option value="">All Categories</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon ? `${category.icon} ` : ""}{category.name}
                    </option>
                  ))}
                </select>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="absolute right-8 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-700 transition-colors"
                    aria-label="Clear category filter"
                  >
                    <span className="text-xs font-medium">×</span>
                  </button>
                )}
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            )}

            {/* Sort Dropdown - only shows in grid view (table view uses column headers) */}
            {viewMode === "grid" && (
            <div className={`relative ${browseMode === "nonprofits" ? "flex-[2] sm:flex-1" : "flex-1"}`}>
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              {/* Mobile: short labels */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="sm:hidden flex h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-10 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-0"
              >
                {SORT_OPTIONS.filter(opt => browseMode === "nonprofits" || opt.value === "name-asc" || opt.value === "name-desc").map((option) => (
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
                {SORT_OPTIONS.filter(opt => browseMode === "nonprofits" || opt.value === "name-asc" || opt.value === "name-desc").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            )}
          </div>
          )}

          {/* Results count */}
          <p className="text-center text-sm text-slate-500">
            {browseMode === "nonprofits" ? (
              <>Showing {filteredNonprofits.length} nonprofit{filteredNonprofits.length !== 1 ? "s" : ""}</>
            ) : (
              <>Showing {filteredCategoriesForView.length} categor{filteredCategoriesForView.length !== 1 ? "ies" : "y"}</>
            )}
          </p>
        </div>

        {/* Content - Nonprofits or Categories */}
        <div className="mt-12 overflow-visible">
          {browseMode === "nonprofits" ? (
            /* Nonprofits View */
            paginatedNonprofits.length > 0 ? (
              <>
                {viewMode === "grid" ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedNonprofits.map((nonprofit) => (
                      <NonprofitCard
                        key={nonprofit.id}
                        nonprofit={nonprofit}
                        onQuickView={handleQuickView}
                      />
                    ))}
                  </div>
                ) : (
                  <NonprofitTable
                    nonprofits={paginatedNonprofits}
                    onQuickView={handleQuickView}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                  />
                )}
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="mt-10"
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>No nonprofits found matching your criteria.</p>
              </div>
            )
          ) : (
            /* Categories View */
            paginatedCategories.length > 0 ? (
              <>
                <CategoryTable
                  categories={paginatedCategories}
                  nonprofitCounts={nonprofitCountByCategory}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onViewOrgs={handleViewOrgsFromCategory}
                />
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="mt-10"
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>No categories found matching your search.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <NonprofitModal
        nonprofit={selectedNonprofit}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
