"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NonprofitCard } from "@/components/directory/nonprofit-card";
import { cn } from "@/lib/utils";
import type { Nonprofit, Category } from "@/types/database";

interface DirectoryClientProps {
  initialNonprofits: Nonprofit[];
  categories: Category[];
}

export function DirectoryClient({
  initialNonprofits,
  categories,
}: DirectoryClientProps) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );

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
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nonprofits..."
              className="pl-10"
            />
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
        </div>

        {/* Featured Nonprofits */}
        {featuredNonprofits.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Featured Organizations
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredNonprofits.map((nonprofit) => (
                <NonprofitCard key={nonprofit.id} nonprofit={nonprofit} />
              ))}
            </div>
          </div>
        )}

        {/* All Nonprofits */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name
              : "All Organizations"}
          </h2>
          {otherNonprofits.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherNonprofits.map((nonprofit) => (
                <NonprofitCard key={nonprofit.id} nonprofit={nonprofit} />
              ))}
            </div>
          ) : featuredNonprofits.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No nonprofits found matching your criteria.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
