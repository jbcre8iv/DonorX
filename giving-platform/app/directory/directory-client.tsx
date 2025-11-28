"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { NonprofitCard } from "@/components/directory/nonprofit-card";
import { NonprofitTable } from "@/components/directory/nonprofit-table";
import { NonprofitModal } from "@/components/directory/nonprofit-modal";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/utils";
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

  const filteredNonprofits = initialNonprofits.filter((nonprofit) => {
    const matchesSearch =
      search === "" ||
      nonprofit.name.toLowerCase().includes(search.toLowerCase()) ||
      nonprofit.mission?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === null || nonprofit.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredNonprofits = filteredNonprofits.filter((n) => n.featured);
  const otherNonprofits = filteredNonprofits.filter((n) => !n.featured);

  // Pagination for non-featured nonprofits (more items per page in table view)
  const itemsPerPage = viewMode === "table" ? ITEMS_PER_PAGE_TABLE : ITEMS_PER_PAGE_GRID;
  const totalPages = Math.ceil(otherNonprofits.length / itemsPerPage);
  const paginatedNonprofits = otherNonprofits.slice(
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
                className="pl-10"
              />
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

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                selectedCategory === null
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  selectedCategory === category.id
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {category.icon && <span className="mr-1">{category.icon}</span>}
                {category.name}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-center text-sm text-slate-500">
            Showing {filteredNonprofits.length} nonprofit{filteredNonprofits.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Featured Nonprofits */}
        {featuredNonprofits.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Featured Organizations
            </h2>
            {viewMode === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredNonprofits.map((nonprofit) => (
                  <NonprofitCard
                    key={nonprofit.id}
                    nonprofit={nonprofit}
                    onQuickView={handleQuickView}
                  />
                ))}
              </div>
            ) : (
              <NonprofitTable
                nonprofits={featuredNonprofits}
                onQuickView={handleQuickView}
              />
            )}
          </div>
        )}

        {/* All Nonprofits */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name
              : "All Organizations"}
          </h2>
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
          ) : featuredNonprofits.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No nonprofits found matching your criteria.</p>
            </div>
          ) : null}
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
