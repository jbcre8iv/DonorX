"use client";

import * as React from "react";
import { Plus, Trash2, Building2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NonprofitSelector } from "./nonprofit-selector";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { config } from "@/lib/config";
import type { Nonprofit, Category } from "@/types/database";

export interface AllocationItem {
  id: string;
  type: "nonprofit" | "category";
  targetId: string;
  targetName: string;
  percentage: number;
}

interface AllocationBuilderProps {
  allocations: AllocationItem[];
  onAllocationsChange: (allocations: AllocationItem[]) => void;
  totalAmountCents: number;
  nonprofits: Nonprofit[];
  categories: Category[];
}

export function AllocationBuilder({
  allocations,
  onAllocationsChange,
  totalAmountCents,
  nonprofits,
  categories,
}: AllocationBuilderProps) {
  const [selectorOpen, setSelectorOpen] = React.useState(false);

  const totalPercentage = allocations.reduce(
    (sum, item) => sum + item.percentage,
    0
  );
  const remainingPercentage = 100 - totalPercentage;

  const handlePercentageChange = (id: string, percentage: number) => {
    const clampedPercentage = Math.max(0, Math.min(percentage, 100));
    onAllocationsChange(
      allocations.map((item) =>
        item.id === id ? { ...item, percentage: clampedPercentage } : item
      )
    );
  };

  const handleRemove = (id: string) => {
    onAllocationsChange(allocations.filter((item) => item.id !== id));
  };

  const handleAddAllocation = (type: "nonprofit" | "category", targetId: string, targetName: string) => {
    if (allocations.length >= config.features.maxAllocationItems) {
      return;
    }

    const defaultPercentage = Math.min(remainingPercentage, 25);
    const newAllocation: AllocationItem = {
      id: crypto.randomUUID(),
      type,
      targetId,
      targetName,
      percentage: defaultPercentage > 0 ? defaultPercentage : 10,
    };

    onAllocationsChange([...allocations, newAllocation]);
  };

  const excludeIds = allocations.map((a) => a.targetId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Allocation</span>
            <span
              className={`text-sm font-normal ${
                totalPercentage === 100
                  ? "text-emerald-600"
                  : totalPercentage > 100
                  ? "text-red-600"
                  : "text-slate-500"
              }`}
            >
              {formatPercentage(totalPercentage)} allocated
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No allocations yet.</p>
              <p className="text-sm">
                Add nonprofits or categories to distribute your donation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    {item.type === "nonprofit" ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {item.targetName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(
                        Math.round((totalAmountCents * item.percentage) / 100)
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePercentageChange(item.id, item.percentage - 5)}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                      disabled={item.percentage <= 0}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.percentage}
                      onChange={(e) =>
                        handlePercentageChange(
                          item.id,
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      min={0}
                      max={100}
                      className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
                    />
                    <button
                      onClick={() => handlePercentageChange(item.id, item.percentage + 5)}
                      className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                      disabled={item.percentage >= 100}
                    >
                      +
                    </button>
                    <span className="text-sm text-slate-500 w-4">%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.id)}
                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all ${
                  totalPercentage === 100
                    ? "bg-emerald-600"
                    : totalPercentage > 100
                    ? "bg-red-600"
                    : "bg-blue-700"
                }`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              />
            </div>
            {remainingPercentage > 0 && (
              <p className="text-xs text-slate-500">
                {formatPercentage(remainingPercentage)} remaining to allocate
              </p>
            )}
            {totalPercentage > 100 && (
              <p className="text-xs text-red-600">
                Over-allocated by {formatPercentage(totalPercentage - 100)}
              </p>
            )}
          </div>

          {/* Add Button */}
          {allocations.length < config.features.maxAllocationItems && (
            <Button
              variant="outline"
              fullWidth
              className="mt-4"
              onClick={() => setSelectorOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Nonprofit or Category
            </Button>
          )}

          {allocations.length >= config.features.maxAllocationItems && (
            <p className="text-xs text-slate-500 text-center">
              Maximum {config.features.maxAllocationItems} allocations allowed
            </p>
          )}
        </CardContent>
      </Card>

      <NonprofitSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleAddAllocation}
        nonprofits={nonprofits}
        categories={categories}
        excludeIds={excludeIds}
      />
    </>
  );
}
