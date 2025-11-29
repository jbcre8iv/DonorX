"use client";

import * as React from "react";
import { Search, Building2, Tag, X, Globe, Check, Plus, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { smartFilterNonprofit, smartFilterCategory } from "@/lib/smart-search";
import type { Nonprofit, Category } from "@/types/database";

type SelectionType = "nonprofit" | "category";

interface NonprofitSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: SelectionType, id: string, name: string) => void;
  nonprofits: Nonprofit[];
  categories: Category[];
  excludeIds?: string[];
}

export function NonprofitSelector({
  open,
  onClose,
  onSelect,
  nonprofits,
  categories,
  excludeIds = [],
}: NonprofitSelectorProps) {
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"nonprofits" | "categories">("nonprofits");

  // Reset search when modal closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

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

  const filteredNonprofits = nonprofits.filter(
    (n) => !excludeIds.includes(n.id) && smartFilterNonprofit(n, search)
  );

  const filteredCategories = categories.filter(
    (c) => !excludeIds.includes(c.id) && smartFilterCategory(c, search)
  );

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
                autoFocus
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("nonprofits")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === "nonprofits"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <Building2 className="h-4 w-4" />
                Nonprofits ({filteredNonprofits.length})
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === "categories"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <Tag className="h-4 w-4" />
                Categories ({filteredCategories.length})
              </button>
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
            ) : (
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
                      {/* Add button that appears on hover */}
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Tag className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No categories found</p>
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            </div>
          ) : (
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
      </div>
    </div>
  );
}
