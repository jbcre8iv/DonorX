"use client";

import { Eye, Heart } from "lucide-react";

interface NonprofitMiniCardProps {
  id: string;
  name: string;
  onClick?: (id: string, name: string) => void;
}

export function NonprofitMiniCard({ id, name, onClick }: NonprofitMiniCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("NonprofitMiniCard clicked:", { id, name });
    onClick?.(id, name);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(id, name);
        }
      }}
      className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm transition-colors group my-1 text-left cursor-pointer select-none"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 group-hover:bg-emerald-200 text-emerald-600">
        <Heart className="h-3 w-3" />
      </span>
      <span className="font-medium text-emerald-900">{name}</span>
      <Eye className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
}
