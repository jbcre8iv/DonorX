"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardFiltersProps {
  categories: { id: string; name: string }[];
  nonprofits: { id: string; name: string }[];
}

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "ytd", label: "Year to Date" },
  { value: "12m", label: "Last 12 Months" },
  { value: "6m", label: "Last 6 Months" },
  { value: "3m", label: "Last 3 Months" },
  { value: "30d", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

export function DashboardFilters({ categories, nonprofits }: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState(searchParams.get("range") || "all");
  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categories")?.split(",").filter(Boolean) || []
  );
  const [selectedNonprofits, setSelectedNonprofits] = useState<string[]>(
    searchParams.get("nonprofits")?.split(",").filter(Boolean) || []
  );

  const hasActiveFilters =
    dateRange !== "all" ||
    selectedCategories.length > 0 ||
    selectedNonprofits.length > 0;

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (dateRange !== "all") {
      params.set("range", dateRange);
    }
    if (dateRange === "custom" && startDate) {
      params.set("start", startDate);
    }
    if (dateRange === "custom" && endDate) {
      params.set("end", endDate);
    }
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }
    if (selectedNonprofits.length > 0) {
      params.set("nonprofits", selectedNonprofits.join(","));
    }

    const queryString = params.toString();
    router.push(`/dashboard${queryString ? `?${queryString}` : ""}`);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setDateRange("all");
    setStartDate("");
    setEndDate("");
    setSelectedCategories([]);
    setSelectedNonprofits([]);
    router.push("/dashboard");
    setShowFilters(false);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleNonprofit = (nonprofitId: string) => {
    setSelectedNonprofits((prev) =>
      prev.includes(nonprofitId)
        ? prev.filter((id) => id !== nonprofitId)
        : [...prev, nonprofitId]
    );
  };

  const getDateRangeLabel = () => {
    const option = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange);
    if (dateRange === "custom" && startDate && endDate) {
      return `${startDate} - ${endDate}`;
    }
    return option?.label || "All Time";
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`gap-2 ${hasActiveFilters ? "border-blue-500 bg-blue-50 text-blue-700" : ""}`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {(dateRange !== "all" ? 1 : 0) +
               (selectedCategories.length > 0 ? 1 : 0) +
               (selectedNonprofits.length > 0 ? 1 : 0)}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </Button>

        {/* Quick filter chips for active filters */}
        {hasActiveFilters && (
          <div className="hidden md:flex items-center gap-2">
            {dateRange !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                <Calendar className="h-3 w-3" />
                {getDateRangeLabel()}
                <button
                  onClick={() => {
                    setDateRange("all");
                    setStartDate("");
                    setEndDate("");
                    applyFilters();
                  }}
                  className="ml-1 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedCategories.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                {selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"}
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    applyFilters();
                  }}
                  className="ml-1 hover:text-emerald-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedNonprofits.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                {selectedNonprofits.length} {selectedNonprofits.length === 1 ? "nonprofit" : "nonprofits"}
                <button
                  onClick={() => {
                    setSelectedNonprofits([]);
                    applyFilters();
                  }}
                  className="ml-1 hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 mt-2 w-[360px] bg-white rounded-lg border border-slate-200 shadow-lg z-50">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Filter Dashboard</h3>
              <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DATE_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {dateRange === "custom" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categories
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Nonprofits */}
            {nonprofits.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nonprofits
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {nonprofits.map((nonprofit) => (
                    <label
                      key={nonprofit.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNonprofits.includes(nonprofit.id)}
                        onChange={() => toggleNonprofit(nonprofit.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 truncate">{nonprofit.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Clear all
            </button>
            <Button onClick={applyFilters} size="sm">
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
