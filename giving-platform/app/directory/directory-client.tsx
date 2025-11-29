"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search, LayoutGrid, List, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { NonprofitCard } from "@/components/directory/nonprofit-card";
import { NonprofitTable } from "@/components/directory/nonprofit-table";
import { NonprofitModal } from "@/components/directory/nonprofit-modal";
import { usePreferences } from "@/hooks/use-preferences";
import { smartFilterNonprofit } from "@/lib/smart-search";
import type { Nonprofit, Category } from "@/types/database";

const ITEMS_PER_PAGE_GRID = 9;
const ITEMS_PER_PAGE_TABLE = 25;

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

  // Find category ID from slug in URL
  const matchedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;
  const initialCategoryId = matchedCategory?.id || null;

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    initialCategoryId
  );
  const [selectedNonprofit, setSelectedNonprofit] = React.useState<Nonprofit | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

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

  // Update selected category when URL changes
  React.useEffect(() => {
    setSelectedCategory(initialCategoryId);
  }, [initialCategoryId]);

  // Reset to page 1 when filters or view mode change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, viewMode]);

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
  const filteredNonprofits = searchFilteredNonprofits.filter((nonprofit) => {
    return selectedCategory === null || nonprofit.category_id === selectedCategory;
  });

  // Featured section disabled - all nonprofits shown in single list
  // Database column preserved for future use
  // const featuredNonprofits = filteredNonprofits.filter((n) => n.featured);
  // const otherNonprofits = filteredNonprofits.filter((n) => !n.featured);

  // Pagination for all nonprofits (more items per page in table view)
  const itemsPerPage = viewMode === "table" ? ITEMS_PER_PAGE_TABLE : ITEMS_PER_PAGE_GRID;
  const totalPages = Math.ceil(filteredNonprofits.length / itemsPerPage);
  const paginatedNonprofits = filteredNonprofits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
          <div className="flex items-center gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nonprofits..."
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

          {/* Category Filter - Dropdown */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-xs">
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
          </div>

          {/* Results count */}
          <p className="text-center text-sm text-slate-500">
            Showing {filteredNonprofits.length} nonprofit{filteredNonprofits.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* All Nonprofits - single unified list */}
        <div className="mt-12">
          {paginatedNonprofits.length > 0 ? (
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
