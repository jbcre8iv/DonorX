"use client";

import * as React from "react";
import { Building2, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import type { Category } from "@/types/database";

interface CategoryCardProps {
  category: Category;
  nonprofitCount: number;
  onViewOrgs?: (categoryId: string) => void;
}

export function CategoryCard({ category, nonprofitCount, onViewOrgs }: CategoryCardProps) {
  const { addToDraft, removeFromDraft, isInDraft } = useCartFavorites();
  const { addToast } = useToast();

  const inDraft = isInDraft(category.id);

  // Toggle donate handler - adds to or removes from draft
  const handleToggleDonate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inDraft) {
      await removeFromDraft(category.id);
      addToast(`Removed ${category.name} from your donation`, "info", 3000);
    } else {
      await addToDraft({
        type: "category",
        targetId: category.id,
        targetName: category.name,
      });
      addToast(`Added ${category.name} to your donation`, "success", 3000);
    }
  };

  return (
    <Card className="flex flex-col h-full group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl flex-shrink-0">
            {category.icon || "📁"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
              {category.name}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {nonprofitCount} nonprofit{nonprofitCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-slate-600 line-clamp-3 flex-1">
          {category.description || "Support organizations in this cause area."}
        </p>

        <div className="mt-4 flex items-center gap-2">
          {/* Toggle Donate Button - adds to or removes from draft */}
          <div className="relative group/btn flex-1">
            <Button
              size="sm"
              className={`w-full ${inDraft ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              onClick={handleToggleDonate}
            >
              {inDraft ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Added
                </>
              ) : (
                "Donate"
              )}
            </Button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
              {inDraft ? "Remove from donation" : "Donate to this cause"}
            </span>
          </div>
          {onViewOrgs && nonprofitCount > 0 && (
            <div className="relative group/btn">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewOrgs(category.id)}
                className="h-9 px-3 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer"
              >
                <Building2 className="h-4 w-4 mr-1.5" />
                <span className="text-xs">{nonprofitCount}</span>
              </Button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded whitespace-nowrap tooltip-animate z-50">
                View nonprofits
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
