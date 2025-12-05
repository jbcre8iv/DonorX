"use client";

import * as React from "react";
import { Search, Building2, Tag, X, Globe, Plus, LayoutGrid, List, Eye, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NonprofitModal } from "@/components/directory/nonprofit-modal";
import { cn } from "@/lib/utils";
import { smartFilterNonprofit, smartFilterCategory } from "@/lib/smart-search";
import type { Nonprofit, Category } from "@/types/database";

type SelectionType = "nonprofit" | "category";

interface NonprofitSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: SelectionType, id: string, name: string) => void;
  onRemove?: (id: string) => void;
  /** Called when user cancels a pending selection (before Apply/Manual Adjust) */
  onCancelPending?: () => void;
  nonprofits: Nonprofit[];
  categories: Category[];
  excludeIds?: string[];
  /** IDs of items already in the allocation (shows as "Added" with toggle behavior) */
  includedIds?: string[];
}

export function NonprofitSelector({
  open,
  onClose,
  onSelect,
  onRemove,
  onCancelPending,
  nonprofits,
  categories,
  excludeIds = [],
  includedIds = [],
}: NonprofitSelectorProps) {
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"nonprofits" | "categories">("nonprofits");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("table");
  const [previewNonprofit, setPreviewNonprofit] = React.useState<Nonprofit | null>(null);
  // Track items clicked but not yet confirmed (pending in rebalance suggestion)
  const [pendingIds, setPendingIds] = React.useState<string[]>([]);
  // Track expanded row for mobile list view
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Reset search and pending items when modal closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setPendingIds([]);
      setExpandedId(null);
    }
  }, [open]);

  // When includedIds changes, remove those items from pendingIds (they're now confirmed)
  React.useEffect(() => {
    setPendingIds((prev) => prev.filter((id) => !includedIds.includes(id)));
  }, [includedIds]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Filter nonprofits - exclude those in excludeIds but keep those in includedIds visible
  const filteredNonprofits = nonprofits.filter(
    (n) => (!excludeIds.includes(n.id) || includedIds.includes(n.id)) && smartFilterNonprofit(n, search)
  );

  const filteredCategories = categories.filter(
    (c) => (!excludeIds.includes(c.id) || includedIds.includes(c.id)) && smartFilterCategory(c, search)
  );

  // Check if an item is already in the allocation OR pending (clicked but not yet confirmed)
  const isIncluded = (id: string) => includedIds.includes(id) || pendingIds.includes(id);

  // Check if item is pending (clicked but not yet confirmed)
  const isPending = (id: string) => pendingIds.includes(id) && !includedIds.includes(id);

  // Handle toggle - add or remove based on current state
  const handleToggle = (type: SelectionType, id: string, name: string) => {
    if (includedIds.includes(id)) {
      // Already confirmed in allocation - remove it
      onRemove?.(id);
    } else if (pendingIds.includes(id)) {
      // Pending - remove from pending (user changed their mind before confirming)
      setPendingIds((prev) => prev.filter((p) => p !== id));
      // Cancel the pending rebalance suggestion in the allocation builder
      onCancelPending?.();
    } else {
      // Not in allocation or pending - add to pending and trigger onSelect
      setPendingIds((prev) => [...prev, id]);
      onSelect(type, id, name);
    }
  };

  const handleSelect = (type: SelectionType, id: string, name: string) => {
    onSelect(type, id, name);
    onClose();
    setSearch("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh]">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal - Much larger to fit cards */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 rounded-t-xl">
          <div className="flex items-center justify-between p-4 pb-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Add to Allocation
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Browse and select nonprofits or categories to add to your donation
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search and Tabs */}
          <div className="p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nonprofits and categories..."
                className="pl-10"
              />
            </div>

            {/* Tabs and View Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => setActiveTab("nonprofits")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none",
                    activeTab === "nonprofits"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  <span>Nonprofits</span>
                  <span className="text-xs opacity-70">({filteredNonprofits.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("categories")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none",
                    activeTab === "categories"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <span>Categories</span>
                  <span className="text-xs opacity-70">({filteredCategories.length})</span>
                </button>
              </div>
              {/* View Toggle - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === "table"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeTab === "nonprofits" ? (
            filteredNonprofits.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No nonprofits found</p>
                <p className="text-sm mt-1">Try adjusting your search terms</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredNonprofits.map((nonprofit) => (
                  <Card
                    key={nonprofit.id}
                    className="group hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                    onClick={() => handleSelect("nonprofit", nonprofit.id, nonprofit.name)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {nonprofit.logo_url ? (
                          <img
                            src={nonprofit.logo_url}
                            alt={`${nonprofit.name} logo`}
                            className="h-12 w-12 rounded-lg object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold text-lg flex-shrink-0">
                            {nonprofit.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                            {nonprofit.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {nonprofit.category && (
                              <Badge variant="secondary" className="text-xs">
                                {nonprofit.category.icon && (
                                  <span className="mr-1">{nonprofit.category.icon}</span>
                                )}
                                {nonprofit.category.name}
                              </Badge>
                            )}
                            {nonprofit.featured && (
                              <Badge variant="success" className="text-xs">Featured</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {nonprofit.mission || nonprofit.description || "No description available."}
                      </p>
                      {nonprofit.ein && (
                        <p className="text-xs text-slate-400 mt-2">
                          EIN: {nonprofit.ein}
                        </p>
                      )}
                      {/* Add/Added button */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {nonprofit.website && (
                            <a
                              href={nonprofit.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                              title="Visit website"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className={`transition-opacity ${isIncluded(nonprofit.id) ? "bg-emerald-600 hover:bg-emerald-700" : "opacity-0 group-hover:opacity-100 bg-emerald-600 hover:bg-emerald-700"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle("nonprofit", nonprofit.id, nonprofit.name);
                          }}
                        >
                          {isIncluded(nonprofit.id) ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Table/List view for nonprofits - expandable rows on mobile */
              <div className="divide-y divide-slate-100">
                {filteredNonprofits.map((nonprofit) => {
                  const isExpanded = expandedId === nonprofit.id;
                  const inAllocation = isIncluded(nonprofit.id);
                  return (
                    <div key={nonprofit.id}>
                      {/* Main row */}
                      <div
                        className={`flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg transition-colors cursor-pointer ${
                          isExpanded
                            ? "bg-blue-50 shadow-[inset_0_0_0_2px_rgb(147,197,253)]"
                            : "hover:bg-slate-50"
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : nonprofit.id)}
                      >
                        {nonprofit.logo_url ? (
                          <img
                            src={nonprofit.logo_url}
                            alt={`${nonprofit.name} logo`}
                            className="h-10 w-10 rounded-lg object-contain flex-shrink-0 bg-slate-50"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold flex-shrink-0">
                            {nonprofit.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-slate-900 leading-tight">
                            {nonprofit.name}
                          </h3>
                          {nonprofit.category && (
                            <Badge variant="secondary" className="text-xs mt-0.5">
                              {nonprofit.category.icon && (
                                <span className="mr-1">{nonprofit.category.icon}</span>
                              )}
                              {nonprofit.category.name}
                            </Badge>
                          )}
                        </div>
                        {/* Mobile: status indicator + chevron */}
                        <div className="flex items-center flex-shrink-0 sm:hidden">
                          {/* Fixed-width container for indicator - keeps chevron aligned */}
                          <div className="w-5 flex items-center justify-center">
                            {inAllocation && !isExpanded && (
                              <span className="relative flex h-3 w-3">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                              </span>
                            )}
                          </div>
                          <div className="h-8 w-8 flex items-center justify-center text-slate-400">
                            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </div>
                        {/* Desktop: action buttons */}
                        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            className={`h-8 ${inAllocation ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle("nonprofit", nonprofit.id, nonprofit.name);
                            }}
                          >
                            {inAllocation ? (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewNonprofit(nonprofit);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {nonprofit.website && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                              asChild
                            >
                              <a
                                href={nonprofit.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Mobile expanded actions row */}
                      {isExpanded && (
                        <div className="sm:hidden bg-blue-50 shadow-[inset_0_0_0_2px_rgb(147,197,253)] px-4 py-3 -mx-2 rounded-b-lg flex items-center justify-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className={`h-10 px-6 ${inAllocation ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                            onClick={() => handleToggle("nonprofit", nonprofit.id, nonprofit.name)}
                          >
                            {inAllocation ? (
                              <>
                                <Check className="h-4 w-4 mr-1.5" />
                                Added
                              </>
                            ) : (
                              "Add"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                            onClick={() => setPreviewNonprofit(nonprofit)}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          {nonprofit.website && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 w-10 p-0 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                              asChild
                            >
                              <a
                                href={nonprofit.website}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Globe className="h-5 w-5" />
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Tag className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No categories found</p>
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="group hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
                  onClick={() => handleSelect("category", category.id, category.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
                        {category.icon || "📁"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        className={`transition-opacity ${isIncluded(category.id) ? "bg-emerald-600 hover:bg-emerald-700" : "opacity-0 group-hover:opacity-100 bg-purple-600 hover:bg-purple-700"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle("category", category.id, category.name);
                        }}
                      >
                        {isIncluded(category.id) ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Table/List view for categories */
            <div className="divide-y divide-slate-100">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="group flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">
                    {category.icon || "📁"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-slate-900 leading-tight">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  {/* Action button matching directory pattern */}
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      className={`h-8 ${isIncluded(category.id) ? "bg-emerald-600 hover:bg-emerald-700" : "bg-purple-600 hover:bg-purple-700"}`}
                      onClick={() => handleToggle("category", category.id, category.name)}
                    >
                      {isIncluded(category.id) ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-4 py-3 rounded-b-xl">
          <p className="text-xs text-slate-500 text-center">
            {activeTab === "categories"
              ? "Category allocations are distributed equally among all approved nonprofits in that category"
              : "Click on a nonprofit card to add it to your donation allocation"
            }
          </p>
        </div>

        {/* Preview Modal - Reuses NonprofitModal component */}
        <NonprofitModal
          nonprofit={previewNonprofit}
          open={!!previewNonprofit}
          onClose={() => setPreviewNonprofit(null)}
          actionLabel="Add to Allocation"
          isAdded={previewNonprofit ? isIncluded(previewNonprofit.id) : false}
          onAction={previewNonprofit ? () => {
            handleToggle("nonprofit", previewNonprofit.id, previewNonprofit.name);
            if (!isIncluded(previewNonprofit.id)) {
              setPreviewNonprofit(null);
            }
          } : undefined}
        />
      </div>
    </div>
  );
}
