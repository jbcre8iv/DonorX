"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { useState, useEffect, useTransition, useRef } from "react";

interface ReceiptsFiltersProps {
  years: number[];
  nonprofits: string[];
}

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  allLabel: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  allLabel,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = value === "all"
    ? allLabel
    : options.find((opt) => opt.value === value)?.label || allLabel;

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm bg-white min-w-[140px] max-w-[200px] ${
          isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-slate-200 pl-8 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {/* All option */}
            <button
              type="button"
              onClick={() => handleSelect("all")}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md ${
                value === "all"
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <span>{allLabel}</span>
              {value === "all" && <Check className="h-4 w-4" />}
            </button>

            {/* Filtered options */}
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md ${
                    value === opt.value
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="h-4 w-4 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
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

  // Convert years and nonprofits to options format
  const yearOptions = years.map((year) => ({
    value: String(year),
    label: String(year),
  }));

  const nonprofitOptions = nonprofits.map((name) => ({
    value: name,
    label: name,
  }));

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
        {/* Year Filter - Searchable */}
        <SearchableSelect
          options={yearOptions}
          value={currentYear}
          onChange={handleYearChange}
          placeholder="Select Year"
          searchPlaceholder="Search years..."
          allLabel="All Years"
        />

        {/* Nonprofit Filter - Searchable */}
        {nonprofits.length > 0 && (
          <SearchableSelect
            options={nonprofitOptions}
            value={currentNonprofit}
            onChange={handleNonprofitChange}
            placeholder="Select Nonprofit"
            searchPlaceholder="Search nonprofits..."
            allLabel="All Nonprofits"
          />
        )}

        {/* Sort - regular select since it has few options */}
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
