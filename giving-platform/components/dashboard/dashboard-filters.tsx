"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Building2, FolderOpen, X, ChevronDown, Check, Search, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmountRangeFilter } from "./amount-range-filter";

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


function FilterDropdown({
  label,
  icon: Icon,
  isOpen,
  onToggle,
  onClose,
  children,
  hasValue,
  alignRight,
}: {
  label: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  hasValue?: boolean;
  alignRight?: boolean;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [leftOffset, setLeftOffset] = useState(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Adjust position to center dropdown on mobile
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 640;

      if (isMobile) {
        // Center the dropdown: offset = 16px (1rem margin) - button's left position
        const buttonRect = dropdownRef.current.getBoundingClientRect();
        const targetLeft = 16; // 1rem margin from left edge
        setLeftOffset(targetLeft - buttonRect.left);
      } else {
        setLeftOffset(0);
      }
    } else {
      setLeftOffset(0);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors w-full sm:w-auto ${
          hasValue
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          ref={contentRef}
          className={`absolute top-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-50 w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[280px] left-0 ${alignRight ? "sm:right-0 sm:left-auto" : "sm:left-0"}`}
          style={{
            transform: leftOffset !== 0 ? `translateX(${leftOffset}px)` : undefined
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DashboardFilters({ categories, nonprofits }: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [nonprofitSearch, setNonprofitSearch] = useState("");

  // Read current values directly from URL params (source of truth)
  const dateRange = searchParams.get("range") || "all";
  const minAmountParam = searchParams.get("minAmount");
  const maxAmountParam = searchParams.get("maxAmount");
  const minAmount = minAmountParam ? parseInt(minAmountParam, 10) : null;
  const maxAmount = maxAmountParam ? parseInt(maxAmountParam, 10) : null;
  const selectedCategories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
  const selectedNonprofits = searchParams.get("nonprofits")?.split(",").filter(Boolean) || [];

  // Custom date inputs - local state for editing before apply
  const urlStart = searchParams.get("start") || "";
  const urlEnd = searchParams.get("end") || "";
  const [customStart, setCustomStart] = useState(urlStart);
  const [customEnd, setCustomEnd] = useState(urlEnd);

  // Track URL values to detect external changes
  const [prevUrlStart, setPrevUrlStart] = useState(urlStart);
  const [prevUrlEnd, setPrevUrlEnd] = useState(urlEnd);

  // Sync local state when URL changes externally (without causing render loop)
  if (urlStart !== prevUrlStart || urlEnd !== prevUrlEnd) {
    setCustomStart(urlStart);
    setCustomEnd(urlEnd);
    setPrevUrlStart(urlStart);
    setPrevUrlEnd(urlEnd);
  }

  const hasActiveFilters =
    dateRange !== "all" ||
    minAmount !== null ||
    maxAmount !== null ||
    selectedCategories.length > 0 ||
    selectedNonprofits.length > 0;

  const applyFilters = (newParams?: {
    range?: string;
    start?: string;
    end?: string;
    minAmount?: number | null;
    maxAmount?: number | null;
    categories?: string[];
    nonprofits?: string[];
  }) => {
    const params = new URLSearchParams();

    const range = newParams?.range ?? dateRange;
    const start = newParams?.start ?? urlStart;
    const end = newParams?.end ?? urlEnd;
    const newMinAmount = newParams?.minAmount !== undefined ? newParams.minAmount : minAmount;
    const newMaxAmount = newParams?.maxAmount !== undefined ? newParams.maxAmount : maxAmount;
    const cats = newParams?.categories ?? selectedCategories;
    const nps = newParams?.nonprofits ?? selectedNonprofits;

    if (range !== "all") {
      params.set("range", range);
    }
    if (range === "custom" && start) {
      params.set("start", start);
    }
    if (range === "custom" && end) {
      params.set("end", end);
    }
    if (newMinAmount !== null) {
      params.set("minAmount", newMinAmount.toString());
    }
    if (newMaxAmount !== null) {
      params.set("maxAmount", newMaxAmount.toString());
    }
    if (cats.length > 0) {
      params.set("categories", cats.join(","));
    }
    if (nps.length > 0) {
      params.set("nonprofits", nps.join(","));
    }

    const queryString = params.toString();
    router.push(`/dashboard${queryString ? `?${queryString}` : ""}`);
  };

  const clearAllFilters = () => {
    setCustomStart("");
    setCustomEnd("");
    router.push("/dashboard");
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    applyFilters({ categories: newCategories });
  };

  const toggleNonprofit = (nonprofitId: string) => {
    const newNonprofits = selectedNonprofits.includes(nonprofitId)
      ? selectedNonprofits.filter((id) => id !== nonprofitId)
      : [...selectedNonprofits, nonprofitId];
    applyFilters({ nonprofits: newNonprofits });
  };

  const selectDateRange = (value: string) => {
    if (value !== "custom") {
      setCustomStart("");
      setCustomEnd("");
      applyFilters({ range: value, start: "", end: "" });
      setOpenDropdown(null);
    } else {
      // For custom, just update the local state without navigating yet
      applyFilters({ range: "custom" });
    }
  };

  const handleAmountRangeChange = (newMin: number | null, newMax: number | null) => {
    applyFilters({ minAmount: newMin, maxAmount: newMax });
  };

  const applyCustomDateRange = () => {
    applyFilters({ range: "custom", start: customStart, end: customEnd });
    setOpenDropdown(null);
  };

  const getDateRangeLabel = () => {
    if (dateRange === "all") return "Date";
    if (dateRange === "custom" && urlStart && urlEnd) {
      const start = new Date(urlStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const end = new Date(urlEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${start} - ${end}`;
    }
    const option = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange);
    return option?.label || "Date";
  };

  const getCategoryLabel = () => {
    if (selectedCategories.length === 0) return "Categories";
    if (selectedCategories.length === 1) {
      const cat = categories.find((c) => c.id === selectedCategories[0]);
      return cat?.name || "1 Category";
    }
    return `${selectedCategories.length} Categories`;
  };

  const getNonprofitLabel = () => {
    if (selectedNonprofits.length === 0) return "Nonprofits";
    if (selectedNonprofits.length === 1) {
      const np = nonprofits.find((n) => n.id === selectedNonprofits[0]);
      const name = np?.name || "1 Nonprofit";
      return name.length > 15 ? name.slice(0, 15) + "..." : name;
    }
    return `${selectedNonprofits.length} Nonprofits`;
  };

  const getAmountRangeLabel = () => {
    if (minAmount === null && maxAmount === null) return "Amount";
    const formatAmount = (amt: number) => {
      if (amt >= 1000000) return `$${(amt / 1000000).toFixed(amt % 1000000 === 0 ? 0 : 1)}M`;
      if (amt >= 1000) return `$${(amt / 1000).toFixed(amt % 1000 === 0 ? 0 : 1)}K`;
      return `$${amt}`;
    };
    const minLabel = minAmount !== null ? formatAmount(minAmount) : "$0";
    const maxLabel = maxAmount !== null ? formatAmount(maxAmount) : "$50M+";
    return `${minLabel} - ${maxLabel}`;
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 sm:flex-wrap">
      {/* Date Range Dropdown */}
      <FilterDropdown
        label={getDateRangeLabel()}
        icon={Calendar}
        isOpen={openDropdown === "date"}
        onToggle={() => setOpenDropdown(openDropdown === "date" ? null : "date")}
        onClose={() => setOpenDropdown(null)}
        hasValue={dateRange !== "all"}
      >
        <div className="py-1">
          {DATE_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => selectDateRange(option.value)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-slate-50 ${
                dateRange === option.value ? "text-blue-600 bg-blue-50" : "text-slate-700"
              }`}
            >
              <span>{option.label}</span>
              {dateRange === option.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>

        {dateRange === "custom" && (
          <div className="p-3 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <Button size="sm" onClick={applyCustomDateRange} className="w-full">
              Apply
            </Button>
          </div>
        )}
      </FilterDropdown>

      {/* Amount Range Dropdown */}
      <FilterDropdown
        label={getAmountRangeLabel()}
        icon={DollarSign}
        isOpen={openDropdown === "amount"}
        onToggle={() => setOpenDropdown(openDropdown === "amount" ? null : "amount")}
        onClose={() => setOpenDropdown(null)}
        hasValue={minAmount !== null || maxAmount !== null}
      >
        <AmountRangeFilter
          minAmount={minAmount}
          maxAmount={maxAmount}
          onChange={handleAmountRangeChange}
        />
      </FilterDropdown>

      {/* Categories Dropdown */}
      {categories.length > 0 && (
        <FilterDropdown
          label={getCategoryLabel()}
          icon={FolderOpen}
          isOpen={openDropdown === "categories"}
          onToggle={() => {
            if (openDropdown === "categories") {
              setOpenDropdown(null);
              setCategorySearch("");
            } else {
              setOpenDropdown("categories");
            }
          }}
          onClose={() => {
            setOpenDropdown(null);
            setCategorySearch("");
          }}
          hasValue={selectedCategories.length > 0}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {categories
              .filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
              .map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-slate-50 ${
                    selectedCategories.includes(category.id) ? "text-blue-600 bg-blue-50" : "text-slate-700"
                  }`}
                >
                  <span>{category.name}</span>
                  {selectedCategories.includes(category.id) && <Check className="h-4 w-4" />}
                </button>
              ))}
            {categories.filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
            )}
          </div>
          {selectedCategories.length > 0 && (
            <div className="p-2 border-t border-slate-200">
              <button
                onClick={() => applyFilters({ categories: [] })}
                className="w-full text-xs text-slate-500 hover:text-slate-700"
              >
                Clear selection
              </button>
            </div>
          )}
        </FilterDropdown>
      )}

      {/* Nonprofits Dropdown */}
      {nonprofits.length > 0 && (
        <FilterDropdown
          label={getNonprofitLabel()}
          icon={Building2}
          isOpen={openDropdown === "nonprofits"}
          onToggle={() => {
            if (openDropdown === "nonprofits") {
              setOpenDropdown(null);
              setNonprofitSearch("");
            } else {
              setOpenDropdown("nonprofits");
            }
          }}
          onClose={() => {
            setOpenDropdown(null);
            setNonprofitSearch("");
          }}
          hasValue={selectedNonprofits.length > 0}
          alignRight
        >
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search nonprofits..."
                value={nonprofitSearch}
                onChange={(e) => setNonprofitSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {nonprofits
              .filter((np) => np.name.toLowerCase().includes(nonprofitSearch.toLowerCase()))
              .map((nonprofit) => (
                <button
                  key={nonprofit.id}
                  onClick={() => toggleNonprofit(nonprofit.id)}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-slate-50 ${
                    selectedNonprofits.includes(nonprofit.id) ? "text-blue-600 bg-blue-50" : "text-slate-700"
                  }`}
                >
                  <span className="truncate pr-2">{nonprofit.name}</span>
                  {selectedNonprofits.includes(nonprofit.id) && <Check className="h-4 w-4 flex-shrink-0" />}
                </button>
              ))}
            {nonprofits.filter((np) => np.name.toLowerCase().includes(nonprofitSearch.toLowerCase())).length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500">No results found</div>
            )}
          </div>
          {selectedNonprofits.length > 0 && (
            <div className="p-2 border-t border-slate-200">
              <button
                onClick={() => applyFilters({ nonprofits: [] })}
                className="w-full text-xs text-slate-500 hover:text-slate-700"
              >
                Clear selection
              </button>
            </div>
          )}
        </FilterDropdown>
      )}

      {/* Clear All Button */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1 px-2 py-2 text-sm text-slate-500 hover:text-slate-700 sm:justify-start"
        >
          <X className="h-4 w-4" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
