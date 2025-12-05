"use client";

import * as React from "react";
import { Plus, Trash2, Building2, Tag, Info, ExternalLink, Globe, Sparkles, ChevronDown, ChevronUp, Check, X, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NonprofitSelector } from "./nonprofit-selector";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { AllocationAdvisor, type Allocation as AIAllocation } from "@/components/ai/allocation-advisor";
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

interface RebalanceSuggestion {
  allocations: AllocationItem[];
  newItemNames: string[];
}

interface RemovalRebalanceSuggestion {
  allocations: AllocationItem[];
  removedItemName: string;
  removedPercentage: number;
}

interface AllocationBuilderProps {
  allocations: AllocationItem[];
  onAllocationsChange: (allocations: AllocationItem[]) => void;
  totalAmountCents: number;
  nonprofits: Nonprofit[];
  categories: Category[];
  donationAmount?: number; // Amount in dollars for AI advisor
  onApplyAiAllocation?: (allocations: AIAllocation[]) => void;
}

export function AllocationBuilder({
  allocations,
  onAllocationsChange,
  totalAmountCents,
  nonprofits,
  categories,
  donationAmount,
  onApplyAiAllocation,
}: AllocationBuilderProps) {
  const [selectorOpen, setSelectorOpen] = React.useState(false);
  const [detailsItem, setDetailsItem] = React.useState<AllocationItem | null>(null);
  const [aiExpanded, setAiExpanded] = React.useState(false);
  const [rebalanceSuggestion, setRebalanceSuggestion] = React.useState<RebalanceSuggestion | null>(null);
  const [removalSuggestion, setRemovalSuggestion] = React.useState<RemovalRebalanceSuggestion | null>(null);

  // Track which allocations were manually adjusted by the user
  const [manuallyAdjustedIds, setManuallyAdjustedIds] = React.useState<Set<string>>(new Set());

  const addSuggestionRef = React.useRef<HTMLDivElement>(null);
  const removalSuggestionRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to suggestion when it appears
  React.useEffect(() => {
    if (rebalanceSuggestion && addSuggestionRef.current) {
      setTimeout(() => {
        addSuggestionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [rebalanceSuggestion]);

  React.useEffect(() => {
    if (removalSuggestion && removalSuggestionRef.current) {
      setTimeout(() => {
        removalSuggestionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [removalSuggestion]);

  // Get the full nonprofit or category details for the details modal
  const getItemDetails = (item: AllocationItem) => {
    if (item.type === "nonprofit") {
      return nonprofits.find((n) => n.id === item.targetId);
    }
    return categories.find((c) => c.id === item.targetId);
  };

  const totalPercentage = allocations.reduce(
    (sum, item) => sum + item.percentage,
    0
  );
  const remainingPercentage = 100 - totalPercentage;

  const handlePercentageChange = (id: string, percentage: number) => {
    const clampedPercentage = Math.max(0, Math.min(percentage, 100));

    // Mark this allocation as manually adjusted
    setManuallyAdjustedIds((prev) => new Set(prev).add(id));

    onAllocationsChange(
      allocations.map((item) =>
        item.id === id ? { ...item, percentage: clampedPercentage } : item
      )
    );
  };

  const handleRemove = (id: string) => {
    const itemToRemove = allocations.find((item) => item.id === id);
    if (!itemToRemove) return;

    // Remove from manually adjusted tracking
    setManuallyAdjustedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    const remainingAllocations = allocations.filter((item) => item.id !== id);

    // If only one item left or removed item had 0%, just remove directly
    if (remainingAllocations.length === 0 || itemToRemove.percentage === 0) {
      onAllocationsChange(remainingAllocations);
      return;
    }

    // Generate smart rebalance suggestion for remaining items
    const suggestedAllocations = generateRemovalRebalanceSuggestion(
      remainingAllocations,
      itemToRemove.percentage
    );

    setRemovalSuggestion({
      allocations: suggestedAllocations,
      removedItemName: itemToRemove.targetName,
      removedPercentage: itemToRemove.percentage,
    });
  };

  // Generate a smart rebalance suggestion when removing an allocation
  const generateRemovalRebalanceSuggestion = (
    remainingAllocations: AllocationItem[],
    freedPercentage: number
  ): AllocationItem[] => {
    // Calculate current total of remaining items
    const currentTotal = remainingAllocations.reduce((sum, item) => sum + item.percentage, 0);

    if (currentTotal === 0) {
      // If all remaining items have 0%, distribute equally
      const equalPercentage = Math.floor(100 / remainingAllocations.length);
      const remainder = 100 - (equalPercentage * remainingAllocations.length);
      return remainingAllocations.map((alloc, index) => ({
        ...alloc,
        percentage: equalPercentage + (index === 0 ? remainder : 0),
      }));
    }

    // Distribute the freed percentage proportionally based on current allocations
    return remainingAllocations.map((alloc, index) => {
      const proportion = alloc.percentage / currentTotal;
      const additionalPercentage = Math.round(freedPercentage * proportion);

      // For the last item, ensure we hit exactly 100%
      if (index === remainingAllocations.length - 1) {
        const othersTotal = remainingAllocations
          .slice(0, -1)
          .reduce((sum, a, i) => {
            const prop = a.percentage / currentTotal;
            return sum + a.percentage + Math.round(freedPercentage * prop);
          }, 0);
        return {
          ...alloc,
          percentage: 100 - othersTotal,
        };
      }

      return {
        ...alloc,
        percentage: alloc.percentage + additionalPercentage,
      };
    });
  };

  const handleAcceptRemovalRebalance = () => {
    if (removalSuggestion) {
      onAllocationsChange(removalSuggestion.allocations);
      setRemovalSuggestion(null);
      // Clear manual tracking since AI suggested these values
      setManuallyAdjustedIds(new Set());
    }
  };

  const handleDeclineRemovalRebalance = () => {
    if (removalSuggestion) {
      // Just remove the item without rebalancing - keep original percentages
      const originalRemaining = allocations.filter(
        (a) => removalSuggestion.allocations.some((s) => s.id === a.id)
      );
      onAllocationsChange(originalRemaining);
      setRemovalSuggestion(null);
    }
  };

  // AI Auto-balance: Intelligently adjust percentages to reach exactly 100%
  // Respects manually adjusted items by only changing non-manual items first
  const handleAiAutoBalance = () => {
    if (allocations.length === 0) return;

    const currentTotal = totalPercentage;
    const difference = 100 - currentTotal;

    if (difference === 0) return;

    // Separate manually adjusted items from auto items
    const manualItems = allocations.filter((a) => manuallyAdjustedIds.has(a.id));
    const autoItems = allocations.filter((a) => !manuallyAdjustedIds.has(a.id));

    // Calculate totals
    const manualTotal = manualItems.reduce((sum, a) => sum + a.percentage, 0);
    const autoTotal = autoItems.reduce((sum, a) => sum + a.percentage, 0);
    const targetAutoTotal = 100 - manualTotal;

    let newAllocations: AllocationItem[];

    // If there are non-manual items, adjust only those
    if (autoItems.length > 0 && targetAutoTotal > 0) {
      // Calculate how to distribute the target among auto items
      let autoRunningTotal = 0;

      const adjustedAutoItems = autoItems.map((alloc, index) => {
        if (index === autoItems.length - 1) {
          // Last auto item gets the remainder
          return {
            ...alloc,
            percentage: Math.max(0, targetAutoTotal - autoRunningTotal),
          };
        }

        let newPercentage: number;
        if (autoTotal === 0) {
          // If all auto items are at 0%, distribute equally
          const equalPercentage = Math.floor(targetAutoTotal / autoItems.length);
          newPercentage = equalPercentage;
        } else {
          // Scale proportionally
          const proportion = alloc.percentage / autoTotal;
          newPercentage = Math.round(targetAutoTotal * proportion);
        }

        autoRunningTotal += newPercentage;
        return {
          ...alloc,
          percentage: newPercentage,
        };
      });

      // Combine manual items (unchanged) with adjusted auto items
      newAllocations = allocations.map((alloc) => {
        if (manuallyAdjustedIds.has(alloc.id)) {
          return alloc; // Keep manual items unchanged
        }
        return adjustedAutoItems.find((a) => a.id === alloc.id) || alloc;
      });
    } else if (autoItems.length === 0 && manualItems.length > 0) {
      // All items are manually adjusted - we need to scale them
      // This is a fallback when user has touched all items
      const scale = 100 / currentTotal;
      let runningTotal = 0;

      newAllocations = allocations.map((alloc, index) => {
        if (index === allocations.length - 1) {
          return {
            ...alloc,
            percentage: 100 - runningTotal,
          };
        }

        const newPercentage = Math.round(alloc.percentage * scale);
        runningTotal += newPercentage;

        return {
          ...alloc,
          percentage: newPercentage,
        };
      });

      // Clear manual tracking since we had to adjust everything
      setManuallyAdjustedIds(new Set());
    } else {
      // Edge case: all items are at 0% and none are manual
      const equalPercentage = Math.floor(100 / allocations.length);
      const remainder = 100 - (equalPercentage * allocations.length);
      newAllocations = allocations.map((alloc, index) => ({
        ...alloc,
        percentage: equalPercentage + (index === 0 ? remainder : 0),
      }));
    }

    onAllocationsChange(newAllocations);
  };

  // Generate a smart rebalance suggestion when adding to existing allocations
  const generateRebalanceSuggestion = (
    currentAllocations: AllocationItem[],
    newItems: AllocationItem[]
  ): AllocationItem[] => {
    const totalItems = currentAllocations.length + newItems.length;

    // Calculate equal distribution as base
    const equalPercentage = Math.floor(100 / totalItems);
    const remainder = 100 - (equalPercentage * totalItems);

    // Create rebalanced allocations
    const rebalanced: AllocationItem[] = currentAllocations.map((alloc, index) => ({
      ...alloc,
      // Give the first item the remainder to ensure 100% total
      percentage: equalPercentage + (index === 0 ? remainder : 0),
    }));

    // Add all new items with equal percentage
    for (const newItem of newItems) {
      rebalanced.push({
        ...newItem,
        percentage: equalPercentage,
      });
    }

    return rebalanced;
  };

  const handleAddAllocation = (type: "nonprofit" | "category", targetId: string, targetName: string) => {
    // Check max allocation limit (accounting for any pending items in suggestion)
    const pendingCount = rebalanceSuggestion ? rebalanceSuggestion.newItemNames.length : 0;
    if (allocations.length + pendingCount >= config.features.maxAllocationItems) {
      return;
    }

    const newAllocation: AllocationItem = {
      id: crypto.randomUUID(),
      type,
      targetId,
      targetName,
      percentage: 0, // Will be set by suggestion or default
    };

    // If there are existing allocations (or an existing suggestion), show/update a rebalance suggestion
    if (allocations.length > 0 || rebalanceSuggestion) {
      // If there's already a pending suggestion, add to it
      if (rebalanceSuggestion) {
        // Get the existing new items from the suggestion (items not in current allocations)
        const existingNewItems = rebalanceSuggestion.allocations.filter(
          (a) => !allocations.some((alloc) => alloc.targetId === a.targetId)
        );
        // Add the new item to the list
        const allNewItems = [...existingNewItems, newAllocation];
        const suggestedAllocations = generateRebalanceSuggestion(allocations, allNewItems);
        setRebalanceSuggestion({
          allocations: suggestedAllocations,
          newItemNames: [...rebalanceSuggestion.newItemNames, targetName],
        });
      } else {
        // Create a new suggestion with just this item
        const suggestedAllocations = generateRebalanceSuggestion(allocations, [newAllocation]);
        setRebalanceSuggestion({
          allocations: suggestedAllocations,
          newItemNames: [targetName],
        });
      }
    } else {
      // First allocation gets 100%
      newAllocation.percentage = 100;
      onAllocationsChange([newAllocation]);
    }
  };

  const handleAcceptRebalance = () => {
    if (rebalanceSuggestion) {
      onAllocationsChange(rebalanceSuggestion.allocations);
      setRebalanceSuggestion(null);
      // Clear manual tracking since AI suggested these values
      setManuallyAdjustedIds(new Set());
    }
  };

  const handleDeclineRebalance = () => {
    if (rebalanceSuggestion) {
      // Get all new items from the suggestion (items not in current allocations)
      const newItems = rebalanceSuggestion.allocations.filter(
        (a) => !allocations.some((alloc) => alloc.targetId === a.targetId)
      );
      // Calculate default percentage for each new item
      const perItemPercentage = Math.min(Math.floor(remainingPercentage / newItems.length), 25);
      const defaultPercentage = perItemPercentage > 0 ? perItemPercentage : 10;

      onAllocationsChange([
        ...allocations,
        ...newItems.map((item) => ({ ...item, percentage: defaultPercentage })),
      ]);
      setRebalanceSuggestion(null);
    }
  };

  const excludeIds = allocations.map((a) => a.targetId);
  // Include both existing allocations and pending items from the rebalance suggestion
  const pendingItemIds = rebalanceSuggestion
    ? rebalanceSuggestion.allocations
        .filter((a) => !allocations.some((alloc) => alloc.targetId === a.targetId))
        .map((a) => a.targetId)
    : [];
  const includedIds = [...allocations.map((a) => a.targetId), ...pendingItemIds];

  // Handle removal from the selector modal (toggle behavior)
  const handleRemoveFromSelector = (targetId: string) => {
    // First check if it's in the current allocations
    const allocation = allocations.find((a) => a.targetId === targetId);
    if (allocation) {
      handleRemove(allocation.id);
      return;
    }

    // Check if it's a pending item in the rebalance suggestion
    if (rebalanceSuggestion) {
      const isPending = rebalanceSuggestion.allocations.some(
        (a) => a.targetId === targetId && !allocations.some((alloc) => alloc.targetId === a.targetId)
      );
      if (isPending) {
        // Remove this item from the pending suggestion
        const remainingNewItems = rebalanceSuggestion.allocations.filter(
          (a) => a.targetId !== targetId && !allocations.some((alloc) => alloc.targetId === a.targetId)
        );
        const remainingNewItemNames = rebalanceSuggestion.newItemNames.filter((_, i) => {
          // Find the item index by matching order (new items are at the end of allocations)
          const newItemsInAllocs = rebalanceSuggestion.allocations.filter(
            (a) => !allocations.some((alloc) => alloc.targetId === a.targetId)
          );
          return newItemsInAllocs[i]?.targetId !== targetId;
        });

        if (remainingNewItems.length === 0) {
          // No more pending items, clear the suggestion
          setRebalanceSuggestion(null);
        } else {
          // Regenerate suggestion with remaining items
          const suggestedAllocations = generateRebalanceSuggestion(allocations, remainingNewItems);
          setRebalanceSuggestion({
            allocations: suggestedAllocations,
            newItemNames: remainingNewItemNames,
          });
        }
      }
    }
  };

  // Color palette for allocation items (matches AI Allocation Advisor colors)
  const getAllocationColor = (index: number) => {
    const colors = [
      { bg: "bg-emerald-100", icon: "text-emerald-600" },
      { bg: "bg-blue-100", icon: "text-blue-600" },
      { bg: "bg-purple-100", icon: "text-purple-600" },
      { bg: "bg-amber-100", icon: "text-amber-600" },
      { bg: "bg-pink-100", icon: "text-pink-600" },
      { bg: "bg-indigo-100", icon: "text-indigo-600" },
    ];
    return colors[index % colors.length];
  };

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
          {/* AI Helper Section - shown when no allocations */}
          {allocations.length === 0 && onApplyAiAllocation && (
            <div className="border border-emerald-200 rounded-lg overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50">
              <button
                onClick={() => setAiExpanded(!aiExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-emerald-100/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-900">Smart giving starts here</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-600">AI Assistant</span>
                  {aiExpanded ? (
                    <ChevronUp className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
              </button>
              {aiExpanded && (
                <div className="px-4 pb-4 border-t border-emerald-200">
                  <AllocationAdvisor
                    amount={donationAmount}
                    onApplyAllocation={onApplyAiAllocation}
                    className="border-0 shadow-none bg-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {allocations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No allocations yet.</p>
              <p className="text-sm">
                Add nonprofits or categories to distribute your donation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.map((item, index) => {
                const colors = getAllocationColor(index);
                const details = getItemDetails(item);
                const nonprofit = item.type === "nonprofit" ? details as Nonprofit | undefined : undefined;
                const category = item.type === "category" ? details as Category | undefined : undefined;
                return (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-4 space-y-3"
                >
                  {/* Top row: Name and info/delete */}
                  <div className="flex items-start gap-3">
                    {nonprofit?.logo_url ? (
                      <img
                        src={nonprofit.logo_url}
                        alt={`${item.targetName} logo`}
                        className="h-10 w-10 rounded-lg object-contain flex-shrink-0"
                      />
                    ) : category?.icon ? (
                      <div className={`h-10 w-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 text-xl`}>
                        {category.icon}
                      </div>
                    ) : (
                      <div className={`h-10 w-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <HandHeart className={`h-5 w-5 ${colors.icon}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 leading-tight">
                        {item.targetName}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatCurrency(
                          Math.round((totalAmountCents * item.percentage) / 100)
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailsItem(item)}
                        className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200"
                        title="View details"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.id)}
                        className="h-9 w-9 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Bottom row: Percentage controls */}
                  <div className="flex items-center gap-3 pl-13">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => handlePercentageChange(item.id, item.percentage - 5)}
                        className="h-10 w-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={item.percentage <= 0}
                      >
                        −
                      </button>
                      <div className="relative w-20 flex-shrink-0">
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
                          className="w-full h-10 rounded-lg border border-slate-200 pl-2 pr-7 text-center text-base font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">%</span>
                      </div>
                      <button
                        onClick={() => handlePercentageChange(item.id, item.percentage + 5)}
                        className="h-10 w-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={item.percentage >= 100}
                      >
                        +
                      </button>
                    </div>
                    {/* Mini progress indicator */}
                    <div className="hidden sm:flex items-center gap-2 flex-1">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
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
            <div className="flex items-center justify-between gap-2">
              <div>
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
              {/* AI Auto-balance button - shown when not at 100% */}
              {allocations.length > 0 && totalPercentage !== 100 && !rebalanceSuggestion && !removalSuggestion && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAiAutoBalance}
                  className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  Auto-balance
                </Button>
              )}
            </div>
          </div>

          {/* AI Rebalance Suggestion (Adding) */}
          {rebalanceSuggestion && (
            <div ref={addSuggestionRef} className="p-4 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-emerald-900">AI Suggested Rebalance</h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    Adding{" "}
                    {rebalanceSuggestion.newItemNames.map((name, i) => (
                      <span key={name}>
                        <span className="font-medium">{name}</span>
                        {i < rebalanceSuggestion.newItemNames.length - 2 && ", "}
                        {i === rebalanceSuggestion.newItemNames.length - 2 && " and "}
                      </span>
                    ))}{" "}
                    to your allocation.
                    Here&apos;s a recommended distribution:
                  </p>
                </div>
              </div>

              {/* Suggested allocation preview */}
              <div className="space-y-2 pl-11">
                {rebalanceSuggestion.allocations.map((alloc) => {
                  const isNewItem = !allocations.some((a) => a.targetId === alloc.targetId);
                  return (
                    <div
                      key={alloc.id}
                      className={`flex items-center justify-between text-sm py-1.5 px-3 rounded ${
                        isNewItem
                          ? "bg-emerald-100 border border-emerald-200"
                          : "bg-white/60"
                      }`}
                    >
                      <span className={`truncate mr-2 ${
                        isNewItem
                          ? "font-medium text-emerald-900"
                          : "text-slate-700"
                      }`}>
                        {alloc.targetName}
                        {isNewItem && (
                          <span className="ml-2 text-xs text-emerald-600">(new)</span>
                        )}
                      </span>
                      <span className="font-medium text-slate-900">{alloc.percentage}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Accept/Decline buttons */}
              <div className="flex gap-3 pl-11">
                <Button
                  onClick={handleAcceptRebalance}
                  size="sm"
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Apply Suggestion
                </Button>
                <Button
                  onClick={handleDeclineRebalance}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Manual Adjust
                </Button>
              </div>
            </div>
          )}

          {/* AI Rebalance Suggestion (Removing) */}
          {removalSuggestion && (
            <div ref={removalSuggestionRef} className="p-4 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-emerald-900">Redistribute {removalSuggestion.removedPercentage}%?</h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    Removing <span className="font-medium">{removalSuggestion.removedItemName}</span> frees up {removalSuggestion.removedPercentage}%.
                    Here&apos;s a suggested redistribution:
                  </p>
                </div>
              </div>

              {/* Suggested allocation preview */}
              <div className="space-y-2 pl-11">
                {removalSuggestion.allocations.map((alloc) => {
                  // Find the original allocation to show the change
                  const original = allocations.find((a) => a.id === alloc.id);
                  const change = original ? alloc.percentage - original.percentage : 0;
                  return (
                    <div
                      key={alloc.id}
                      className="flex items-center justify-between text-sm py-1.5 px-3 rounded bg-white/60"
                    >
                      <span className="truncate mr-2 text-slate-700">
                        {alloc.targetName}
                      </span>
                      <div className="flex items-center gap-2">
                        {change > 0 && (
                          <span className="text-xs text-emerald-600 font-medium">+{change}%</span>
                        )}
                        <span className="font-medium text-slate-900">{alloc.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Accept/Decline buttons */}
              <div className="flex gap-3 pl-11">
                <Button
                  onClick={handleAcceptRemovalRebalance}
                  size="sm"
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Apply Redistribution
                </Button>
                <Button
                  onClick={handleDeclineRemovalRebalance}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Just Remove
                </Button>
              </div>
            </div>
          )}

          {/* Add Button */}
          {allocations.length < config.features.maxAllocationItems && !rebalanceSuggestion && !removalSuggestion && (
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
        onRemove={handleRemoveFromSelector}
        onCancelPending={() => setRebalanceSuggestion(null)}
        nonprofits={nonprofits}
        categories={categories}
        excludeIds={excludeIds}
        includedIds={includedIds}
      />

      {/* Details Modal */}
      <Modal open={!!detailsItem} onClose={() => setDetailsItem(null)}>
        {detailsItem && (() => {
          const details = getItemDetails(detailsItem);
          if (!details) return null;

          if (detailsItem.type === "nonprofit") {
            const nonprofit = details as Nonprofit;
            return (
              <>
                <ModalHeader>
                  <div className="flex items-start gap-4">
                    {nonprofit.logo_url ? (
                      <img
                        src={nonprofit.logo_url}
                        alt={`${nonprofit.name} logo`}
                        className="h-12 w-12 rounded-lg object-contain flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-emerald-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold text-slate-900 pr-8">
                        {nonprofit.name}
                      </h2>
                      {nonprofit.ein && (
                        <p className="text-sm text-slate-500 mt-1">
                          EIN: {nonprofit.ein}
                        </p>
                      )}
                    </div>
                  </div>
                </ModalHeader>
                <ModalBody className="space-y-4">
                  {nonprofit.category && (
                    <div>
                      <Badge variant="secondary">{nonprofit.category.name}</Badge>
                    </div>
                  )}

                  {nonprofit.mission && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-1">Mission</h4>
                      <p className="text-sm text-slate-600">{nonprofit.mission}</p>
                    </div>
                  )}

                  {nonprofit.description && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-1">About</h4>
                      <p className="text-sm text-slate-600">{nonprofit.description}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {nonprofit.website && (
                      <a
                        href={nonprofit.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Globe className="h-4 w-4" />
                        Visit Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Your allocation</span>
                      <span className="font-semibold text-slate-900">
                        {detailsItem.percentage}% ({formatCurrency(
                          Math.round((totalAmountCents * detailsItem.percentage) / 100)
                        )})
                      </span>
                    </div>
                  </div>
                </ModalBody>
              </>
            );
          } else {
            const category = details as Category;
            return (
              <>
                <ModalHeader>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 text-2xl">
                      {category.icon || <Tag className="h-6 w-6 text-purple-600" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold text-slate-900 pr-8">
                        {category.name}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Category
                      </p>
                    </div>
                  </div>
                </ModalHeader>
                <ModalBody className="space-y-4">
                  {category.description && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-1">About this category</h4>
                      <p className="text-sm text-slate-600">{category.description}</p>
                    </div>
                  )}

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-sm text-purple-800">
                      Donations to this category will be distributed among verified nonprofits working in this area.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Your allocation</span>
                      <span className="font-semibold text-slate-900">
                        {detailsItem.percentage}% ({formatCurrency(
                          Math.round((totalAmountCents * detailsItem.percentage) / 100)
                        )})
                      </span>
                    </div>
                  </div>
                </ModalBody>
              </>
            );
          }
        })()}
      </Modal>
    </>
  );
}
