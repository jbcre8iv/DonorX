"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-medium transition-colors",
          selected === null
            ? "bg-blue-700 text-white"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            selected === category.id
              ? "bg-blue-700 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
