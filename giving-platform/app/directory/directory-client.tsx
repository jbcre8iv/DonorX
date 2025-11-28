"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { NonprofitCard } from "@/components/directory/nonprofit-card";
import { NonprofitTable } from "@/components/directory/nonprofit-table";
import { NonprofitModal } from "@/components/directory/nonprofit-modal";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/utils";
import { smartFilterNonprofit } from "@/lib/smart-search";
import type { Nonprofit, Category } from "@/types/database";

const ITEMS_PER_PAGE_GRID = 9;
const ITEMS_PER_PAGE_TABLE = 25;

// Horizontal scrollable category filter
function CategoryScroller({
  categories,
  selectedCategory,
  onSelectCategory,
}: {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
      {/* Left Arrow */}
      <button
        onClick={() => scroll("left")}
        className={cn(
          "flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-opacity",
          canScrollLeft ? "opacity-100 hover:bg-slate-50" : "opacity-0 pointer-events-none"
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4 text-slate-600" />
      </button>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 overflow-x-auto scrollbar-hide flex gap-2 py-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
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
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1",
              selectedCategory === category.id
                ? "bg-blue-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {category.icon && <span>{category.icon}</span>}
            {category.name}
          </button>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll("right")}
        className={cn(
          "flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-opacity",
          canScrollRight ? "opacity-100 hover:bg-slate-50" : "opacity-0 pointer-events-none"
        )}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4 text-slate-600" />
      </button>
    </div>
  );
}

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
    const matchesSearch = smartFilterNonprofit(nonprofit, search);
    const matchesCategory =
      selectedCategory === null || nonprofit.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
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

          {/* Category Filter - Horizontal Scrollable */}
          <CategoryScroller
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

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
