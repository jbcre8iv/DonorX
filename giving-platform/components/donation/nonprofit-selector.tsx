"use client";

import * as React from "react";
import { Search, Building2, Tag } from "lucide-react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <ModalHeader>
        <h2 className="text-xl font-bold text-slate-900 pr-8">
          Add to Allocation
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Select a nonprofit or category to add to your donation allocation
        </p>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("nonprofits")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "nonprofits"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Building2 className="h-4 w-4" />
            Nonprofits ({filteredNonprofits.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "categories"
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Tag className="h-4 w-4" />
            Categories ({filteredCategories.length})
          </button>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto -mx-6 px-6">
          {activeTab === "nonprofits" ? (
            filteredNonprofits.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-sm">
                No nonprofits found
              </p>
            ) : (
              <div className="space-y-2">
                {filteredNonprofits.map((nonprofit) => (
                  <button
                    key={nonprofit.id}
                    onClick={() => handleSelect("nonprofit", nonprofit.id, nonprofit.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    {nonprofit.logo_url ? (
                      <img
                        src={nonprofit.logo_url}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
                        {nonprofit.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {nonprofit.name}
                      </p>
                      {nonprofit.category && (
                        <Badge variant="secondary" className="mt-1">
                          {nonprofit.category.name}
                        </Badge>
                      )}
                    </div>
                    {nonprofit.featured && (
                      <Badge variant="success">Featured</Badge>
                    )}
                  </button>
                ))}
              </div>
            )
          ) : filteredCategories.length === 0 ? (
            <p className="text-center py-8 text-slate-500 text-sm">
              No categories found
            </p>
          ) : (
            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSelect("category", category.id, category.name)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl">
                    {category.icon || "📁"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-slate-500 truncate">
                        {category.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 text-center pt-2">
          Category allocations are distributed equally among all approved nonprofits in that category
        </p>
      </ModalBody>
    </Modal>
  );
}
