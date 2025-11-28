"use client";

import Link from "next/link";
import { ExternalLink, Eye, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Nonprofit } from "@/types/database";

interface NonprofitTableProps {
  nonprofits: Nonprofit[];
  onQuickView?: (nonprofit: Nonprofit) => void;
}

export function NonprofitTable({ nonprofits, onQuickView }: NonprofitTableProps) {
  if (nonprofits.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No nonprofits found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
            <th className="pb-3 font-medium">Organization</th>
            <th className="pb-3 font-medium hidden sm:table-cell">Category</th>
            <th className="pb-3 font-medium hidden lg:table-cell">Mission</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {nonprofits.map((nonprofit) => (
            <tr key={nonprofit.id} className="text-sm hover:bg-slate-50 transition-colors">
              <td className="py-3 pr-4">
                <Link href={`/directory/${nonprofit.id}`} className="flex items-center gap-3 group">
                  {nonprofit.logo_url ? (
                    <img
                      src={nonprofit.logo_url}
                      alt={`${nonprofit.name} logo`}
                      className="h-10 w-10 rounded-lg object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold flex-shrink-0">
                      {nonprofit.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                        {nonprofit.name}
                      </span>
                      {nonprofit.featured && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    {nonprofit.ein && (
                      <p className="text-xs text-slate-400">EIN: {nonprofit.ein}</p>
                    )}
                    {/* Show category on mobile */}
                    {nonprofit.category && (
                      <Badge variant="secondary" className="mt-1 sm:hidden text-xs">
                        {nonprofit.category.icon && (
                          <span className="mr-1">{nonprofit.category.icon}</span>
                        )}
                        {nonprofit.category.name}
                      </Badge>
                    )}
                  </div>
                </Link>
              </td>
              <td className="py-3 pr-4 hidden sm:table-cell">
                {nonprofit.category && (
                  <Badge variant="secondary">
                    {nonprofit.category.icon && (
                      <span className="mr-1">{nonprofit.category.icon}</span>
                    )}
                    {nonprofit.category.name}
                  </Badge>
                )}
              </td>
              <td className="py-3 pr-4 hidden lg:table-cell">
                <p className="text-slate-600 line-clamp-2 max-w-md">
                  {nonprofit.mission || nonprofit.description || "No description"}
                </p>
              </td>
              <td className="py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button asChild size="sm" className="h-8">
                    <Link href={`/donate?nonprofit=${nonprofit.id}`}>Donate</Link>
                  </Button>
                  {onQuickView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onQuickView(nonprofit)}
                      title="Quick View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {/* Fixed-width container for external link to prevent layout shift */}
                  <div className="w-8 h-8 flex items-center justify-center">
                    {nonprofit.website && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <a
                          href={nonprofit.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Visit Website"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
