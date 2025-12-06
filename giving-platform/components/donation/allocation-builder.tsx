"use client";

import * as React from "react";
import { Plus, Trash2, Building2, Tag, Info, ExternalLink, Globe, Sparkles, ChevronDown, ChevronUp, Check, X, HandHeart, Lock, Unlock } from "lucide-react";
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

// Pending removal for confirmation dialog
interface PendingRemoval {
  id: string;
  targetId: string;
  targetName: string;
}

interface AllocationBuilderProps {
  allocations: AllocationItem[];
  onAllocationsChange: (allocations: AllocationItem[]) => void;
  totalAmountCents: number;
  nonprofits: Nonprofit[];
  categories: Category[];
  donationAmount?: number; // Amount in dollars for AI advisor
  onApplyAiAllocation?: (allocations: AIAllocation[]) => void;
  // Lock functionality
  lockedIds?: string[];
  onToggleLock?: (targetId: string, currentPercentage?: number) => void;
  canLock?: (targetId: string) => boolean;
}

export function AllocationBuilder({
  allocations,
  onAllocationsChange,
  totalAmountCents,
  nonprofits,
  categories,
  donationAmount,
  onApplyAiAllocation,
  lockedIds = [],
  onToggleLock,
  canLock,
}: AllocationBuilderProps) {
  const [selectorOpen, setSelectorOpen] = React.useState(false);
  const [detailsItem, setDetailsItem] = React.useState<AllocationItem | null>(null);
  const [aiExpanded, setAiExpanded] = React.useState(false);
  const [pendingRemoval, setPendingRemoval] = React.useState<PendingRemoval | null>(null);

  // Track which allocations were manually adjusted by the user
  const [manuallyAdjustedIds, setManuallyAdjustedIds] = React.useState<Set<string>>(new Set());

  // Track percentage input values as strings to allow empty field during editing
  const [percentageInputs, setPercentageInputs] = React.useState<Record<string, string>>({});

  // Sync input values when allocations change externally (e.g., +/- buttons, rebalancing)
  React.useEffect(() => {
    // Update any input values that don't match current allocation values
    // This ensures +/- buttons and rebalancing update the displayed value
    setPercentageInputs((prev) => {
      const updated: Record<string, string> = {};
      let hasChanges = false;

      for (const alloc of allocations) {
        const currentInput = prev[alloc.id];
        const allocPercentStr = String(alloc.percentage);

        // Only update if the input value differs from allocation and isn't empty (user is typing)
        if (currentInput !== undefined && currentInput !== "" && currentInput !== allocPercentStr) {
          updated[alloc.id] = allocPercentStr;
          hasChanges = true;
        } else if (currentInput !== undefined) {
          updated[alloc.id] = currentInput;
        }
      }

      return hasChanges ? updated : prev;
    });
  }, [allocations]);

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

  // Handle percentage input change - allows empty string during editing
  const handlePercentageInputChange = (id: string, value: string) => {
    // Allow empty string or valid numbers
    if (value === "" || /^\d*$/.test(value)) {
      setPercentageInputs((prev) => ({ ...prev, [id]: value }));

      // If it's a valid number, update the actual allocation
      if (value !== "") {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          handlePercentageChange(id, numValue);
        }
      }
    }
  };

  // Handle blur - populate 0 if field is empty
  const handlePercentageInputBlur = (id: string) => {
    const currentValue = percentageInputs[id];
    if (currentValue === "" || currentValue === undefined) {
      // Set to 0 when blurred with empty value
      handlePercentageChange(id, 0);
      setPercentageInputs((prev) => ({ ...prev, [id]: "0" }));
    }
  };

  // Get the display value for percentage input (use local state if available, otherwise use allocation value)
  const getPercentageInputValue = (id: string, percentage: number): string => {
    if (percentageInputs[id] !== undefined) {
      return percentageInputs[id];
    }
    return String(percentage);
  };

  // Show confirmation dialog before removing
  const handleRemoveClick = (item: AllocationItem) => {
    setPendingRemoval({
      id: item.id,
      targetId: item.targetId,
      targetName: item.targetName,
    });
  };

  // Actually remove the item after confirmation
  const handleConfirmRemoval = () => {
    if (!pendingRemoval) return;

    // Remove from manually adjusted tracking
    setManuallyAdjustedIds((prev) => {
      const next = new Set(prev);
      next.delete(pendingRemoval.id);
      return next;
    });

    const remainingAllocations = allocations.filter((item) => item.id !== pendingRemoval.id);
    onAllocationsChange(remainingAllocations);
    setPendingRemoval(null);
  };

  // Cancel the removal
  const handleCancelRemoval = () => {
    setPendingRemoval(null);
  };

  // AI Auto-balance: Intelligently adjust percentages to reach exactly 100%
  // Priority: 1) Locked items NEVER change, 2) Respect manually adjusted unlocked items if possible
  const handleAiAutoBalance = () => {
    if (allocations.length === 0) return;

    const currentTotal = totalPercentage;
    const difference = 100 - currentTotal;

    if (difference === 0) return;

    // First, separate locked from unlocked items (locked items are NEVER touched)
    const lockedItems = allocations.filter((a) => lockedIds.includes(a.targetId));
    const unlockedItems = allocations.filter((a) => !lockedIds.includes(a.targetId));

    // Calculate locked total - this is fixed and cannot change
    const lockedTotal = lockedItems.reduce((sum, a) => sum + a.percentage, 0);
    const targetUnlockedTotal = Math.max(0, 100 - lockedTotal);

    // If no unlocked items, we can't balance
    if (unlockedItems.length === 0) return;

    // Among unlocked items, separate manually adjusted from auto items
    const manualUnlockedItems = unlockedItems.filter((a) => manuallyAdjustedIds.has(a.id));
    const autoUnlockedItems = unlockedItems.filter((a) => !manuallyAdjustedIds.has(a.id));

    let adjustedUnlockedItems: AllocationItem[];

    // If there are non-manual unlocked items, try to adjust only those first
    if (autoUnlockedItems.length > 0) {
      const manualUnlockedTotal = manualUnlockedItems.reduce((sum, a) => sum + a.percentage, 0);
      const targetAutoTotal = Math.max(0, targetUnlockedTotal - manualUnlockedTotal);
      const autoTotal = autoUnlockedItems.reduce((sum, a) => sum + a.percentage, 0);

      let autoRunningTotal = 0;
      const adjustedAutoItems = autoUnlockedItems.map((alloc, index) => {
        if (index === autoUnlockedItems.length - 1) {
          return {
            ...alloc,
            percentage: Math.max(0, targetAutoTotal - autoRunningTotal),
          };
        }

        let newPercentage: number;
        if (autoTotal === 0) {
          const equalPercentage = Math.floor(targetAutoTotal / autoUnlockedItems.length);
          newPercentage = equalPercentage;
        } else {
          const proportion = alloc.percentage / autoTotal;
          newPercentage = Math.round(targetAutoTotal * proportion);
        }

        autoRunningTotal += newPercentage;
        return { ...alloc, percentage: newPercentage };
      });

      // Combine: manual unlocked items unchanged, auto unlocked items adjusted
      adjustedUnlockedItems = unlockedItems.map((alloc) => {
        if (manuallyAdjustedIds.has(alloc.id)) {
          return alloc;
        }
        return adjustedAutoItems.find((a) => a.id === alloc.id) || alloc;
      });
    } else {
      // All unlocked items are manually adjusted - we MUST adjust them anyway
      // (This is the key fix: locked items are protected, but if only unlocked items
      // are marked as "manual", we still need to adjust them to reach 100%)
      const unlockedTotal = unlockedItems.reduce((sum, a) => sum + a.percentage, 0);

      if (unlockedTotal === 0) {
        // Distribute equally among unlocked items
        const equalPercentage = Math.floor(targetUnlockedTotal / unlockedItems.length);
        const remainder = targetUnlockedTotal - (equalPercentage * unlockedItems.length);
        adjustedUnlockedItems = unlockedItems.map((alloc, index) => ({
          ...alloc,
          percentage: equalPercentage + (index === 0 ? remainder : 0),
        }));
      } else {
        // Scale proportionally
        const scale = targetUnlockedTotal / unlockedTotal;
        let runningTotal = 0;

        adjustedUnlockedItems = unlockedItems.map((alloc, index) => {
          if (index === unlockedItems.length - 1) {
            return { ...alloc, percentage: targetUnlockedTotal - runningTotal };
          }
          const newPercentage = Math.round(alloc.percentage * scale);
          runningTotal += newPercentage;
          return { ...alloc, percentage: newPercentage };
        });
      }

      // Clear manual tracking for unlocked items since we had to adjust them
      const newManualIds = new Set(manuallyAdjustedIds);
      unlockedItems.forEach((a) => newManualIds.delete(a.id));
      setManuallyAdjustedIds(newManualIds);
    }

    // Build final allocations: locked items unchanged, unlocked items adjusted
    const newAllocations = allocations.map((alloc) => {
      if (lockedIds.includes(alloc.targetId)) {
        return alloc; // Locked items NEVER change
      }
      return adjustedUnlockedItems.find((a) => a.id === alloc.id) || alloc;
    });

    onAllocationsChange(newAllocations);
  };

  // Handle adding allocation - auto-balances immediately (no blocking popup)
  const handleAddAllocation = (type: "nonprofit" | "category", targetId: string, targetName: string) => {
    // Check max allocation limit
    if (allocations.length >= config.features.maxAllocationItems) {
      return;
    }

    const newAllocation: AllocationItem = {
      id: crypto.randomUUID(),
      type,
      targetId,
      targetName,
      percentage: 0,
    };

    if (allocations.length === 0) {
      // First allocation gets 100%
      newAllocation.percentage = 100;
      onAllocationsChange([newAllocation]);
      return;
    }

    // Auto-balance: distribute equally among all items (respecting locks)
    // Separate locked and unlocked items
    const lockedItems = allocations.filter((a) => lockedIds.includes(a.targetId));
    const unlockedItems = allocations.filter((a) => !lockedIds.includes(a.targetId));

    // Calculate locked total
    const lockedTotal = lockedItems.reduce((sum, a) => sum + a.percentage, 0);
    const remainingForUnlocked = Math.max(0, 100 - lockedTotal);
    const totalUnlockedItems = unlockedItems.length + 1; // +1 for new item

    const equalPercentage = Math.floor(remainingForUnlocked / totalUnlockedItems);
    const remainder = remainingForUnlocked - (equalPercentage * totalUnlockedItems);

    // Build new allocations
    let firstUnlockedAssigned = false;
    const newAllocations: AllocationItem[] = [
      ...allocations.map((alloc) => {
        if (lockedIds.includes(alloc.targetId)) {
          return alloc; // Locked items keep their percentage
        }
        const pct = !firstUnlockedAssigned ? equalPercentage + remainder : equalPercentage;
        firstUnlockedAssigned = true;
        return { ...alloc, percentage: pct };
      }),
      { ...newAllocation, percentage: equalPercentage },
    ];

    onAllocationsChange(newAllocations);
    setManuallyAdjustedIds(new Set()); // Clear manual tracking since we auto-balanced
  };

  const excludeIds = allocations.map((a) => a.targetId);
  const includedIds = allocations.map((a) => a.targetId);

  // Handle removal from the selector modal (toggle behavior) - removes directly without confirmation
  const handleRemoveFromSelector = (targetId: string) => {
    const allocation = allocations.find((a) => a.targetId === targetId);
    if (allocation) {
      // Direct removal for toggle behavior in selector
      setManuallyAdjustedIds((prev) => {
        const next = new Set(prev);
        next.delete(allocation.id);
        return next;
      });
      const remainingAllocations = allocations.filter((item) => item.id !== allocation.id);
      onAllocationsChange(remainingAllocations);
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
                        onClick={() => handleRemoveClick(item)}
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
                        onClick={() => handlePercentageChange(item.id, item.percentage - 1)}
                        className="h-10 w-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={item.percentage <= 0 || lockedIds.includes(item.targetId)}
                      >
                        −
                      </button>
                      <div className="relative w-20 flex-shrink-0">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={getPercentageInputValue(item.id, item.percentage)}
                          onChange={(e) => handlePercentageInputChange(item.id, e.target.value)}
                          onBlur={() => handlePercentageInputBlur(item.id)}
                          className={`w-full h-10 rounded-lg border pl-2 pr-7 text-center text-base font-medium ${
                            lockedIds.includes(item.targetId)
                              ? "border-amber-300 bg-amber-50"
                              : "border-slate-200"
                          }`}
                          disabled={lockedIds.includes(item.targetId)}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">%</span>
                      </div>
                      <button
                        onClick={() => handlePercentageChange(item.id, item.percentage + 1)}
                        className="h-10 w-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={item.percentage >= 100 || lockedIds.includes(item.targetId)}
                      >
                        +
                      </button>
                      {/* Lock button */}
                      {onToggleLock && (
                        <button
                          onClick={() => {
                            // Get the current input value (which may not be saved yet)
                            const inputValue = percentageInputs[item.id];
                            const currentPct = inputValue !== undefined && inputValue !== ""
                              ? parseInt(inputValue, 10)
                              : item.percentage;
                            onToggleLock(item.targetId, currentPct);
                          }}
                          disabled={!canLock?.(item.targetId)}
                          className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors ${
                            lockedIds.includes(item.targetId)
                              ? "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
                              : canLock?.(item.targetId)
                              ? "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                              : "border-slate-100 text-slate-300 cursor-not-allowed"
                          }`}
                          title={
                            lockedIds.includes(item.targetId)
                              ? "Unlock (allow auto-balance)"
                              : canLock?.(item.targetId)
                              ? "Lock (exclude from auto-balance)"
                              : "Cannot lock - at least one item must remain unlocked"
                          }
                        >
                          {lockedIds.includes(item.targetId) ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </button>
                      )}
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
              {allocations.length > 0 && totalPercentage !== 100 && (
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

          {/* Remove Confirmation Dialog */}
          {pendingRemoval && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-red-900">Remove {pendingRemoval.targetName}?</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This will remove it from your allocation. You can use Auto-balance afterward to redistribute percentages.
                  </p>
                </div>
              </div>

              {/* Confirm/Cancel buttons */}
              <div className="flex gap-3 sm:pl-11">
                <Button
                  onClick={handleConfirmRemoval}
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
                <Button
                  onClick={handleCancelRemoval}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Add Button */}
          {allocations.length < config.features.maxAllocationItems && !pendingRemoval && (
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
