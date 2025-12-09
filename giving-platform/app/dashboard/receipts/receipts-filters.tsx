"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SortAsc, SortDesc } from "lucide-react";
import { useState, useEffect, useTransition } from "react";

interface ReceiptsFiltersProps {
  years: number[];
  nonprofits: string[];
}

export function ReceiptsFilters({ years, nonprofits }: ReceiptsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentYear = searchParams.get("year") || "all";
  const currentNonprofit = searchParams.get("nonprofit") || "all";
  const currentSort = searchParams.get("sort") || "newest";
  const currentSearch = searchParams.get("q") || "";

  const [searchValue, setSearchValue] = useState(currentSearch);

  // Sync search value with URL params
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  const updateParams = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "" || (key === "sort" && value === "newest")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const queryString = params.toString();
      router.push(`/dashboard/receipts${queryString ? `?${queryString}` : ""}`);
    });
  };

  const handleYearChange = (value: string) => {
    updateParams("year", value);
  };

  const handleNonprofitChange = (value: string) => {
    updateParams("nonprofit", value);
  };

  const handleSortChange = (value: string) => {
    updateParams("sort", value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("q", searchValue.trim());
  };

  const handleSearchClear = () => {
    setSearchValue("");
    updateParams("q", "");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by nonprofit name or amount..."
          className="w-full rounded-lg border border-slate-200 pl-10 pr-20 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleSearchClear}
            className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
          >
            Clear
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Year Filter */}
        <select
          value={currentYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="all">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Nonprofit Filter */}
        {nonprofits.length > 0 && (
          <select
            value={currentNonprofit}
            onChange={(e) => handleNonprofitChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white max-w-[200px]"
          >
            <option value="all">All Nonprofits</option>
            {nonprofits.map((name) => (
              <option key={name} value={name}>
                {name.length > 25 ? name.slice(0, 25) + "..." : name}
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Amount: High to Low</option>
          <option value="amount-low">Amount: Low to High</option>
        </select>

        {/* Loading indicator */}
        {isPending && (
          <span className="text-sm text-slate-500 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
            Loading...
          </span>
        )}
      </div>
    </div>
  );
}
