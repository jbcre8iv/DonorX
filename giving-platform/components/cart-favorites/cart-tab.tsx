"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Trash2, Tag, ArrowRight, HandHeart, Eye, X, Globe, Minus, Plus, Sparkles, Check, Lock, Unlock } from "lucide-react";
import { useCartFavorites, type CartItem, type DraftAllocation, type RemovalRebalanceSuggestion } from "@/contexts/cart-favorites-context";
import { Button } from "@/components/ui/button";

export function CartTab() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    cartItems,
    removeFromCart,
    clearCart,
    setSidebarOpen,
    donationDraft,
    hasDraft,
    saveDonationDraft,
    clearDonationDraft,
    removeFromDraft,
    updateDraftAllocation,
    rebalanceSuggestion,
    applyRebalanceSuggestion,
    declineRebalanceSuggestion,
    removalSuggestion,
    setRemovalSuggestion,
    applyRemovalSuggestion,
    declineRemovalSuggestion,
    toggleLockAllocation,
    isLocked,
    canLock,
  } = useCartFavorites();

  const [isClearing, setIsClearing] = useState(false);
  const [isClearingDraft, setIsClearingDraft] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState<CartItem | null>(null);

  // Track percentage input values as strings to allow empty field during editing
  const [percentageInputs, setPercentageInputs] = useState<Record<string, string>>({});

  // Track previous allocations to detect external changes
  const prevAllocationsRef = useRef<string>("");

  // Clear input cache when allocations change externally (e.g., from donate page)
  useEffect(() => {
    if (!donationDraft) {
      setPercentageInputs({});
      prevAllocationsRef.current = "";
      return;
    }

    // Create a signature of current allocations
    const currentSignature = donationDraft.allocations
      .map((a) => `${a.targetId}:${a.percentage}`)
      .sort()
      .join(",");

    // If allocations changed and we have cached inputs, clear them
    if (prevAllocationsRef.current && prevAllocationsRef.current !== currentSignature) {
      setPercentageInputs({});
    }

    prevAllocationsRef.current = currentSignature;
  }, [donationDraft]);

  // Handle percentage input change - allows empty string during editing
  const handlePercentageInputChange = useCallback((targetId: string, value: string) => {
    if (value === "" || /^\d*$/.test(value)) {
      setPercentageInputs((prev) => ({ ...prev, [targetId]: value }));

      if (value !== "") {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          updateDraftAllocation(targetId, numValue);
        }
      }
    }
  }, [updateDraftAllocation]);

  // Handle blur - populate 0 if field is empty
  const handlePercentageInputBlur = useCallback((targetId: string) => {
    const currentValue = percentageInputs[targetId];
    if (currentValue === "" || currentValue === undefined) {
      updateDraftAllocation(targetId, 0);
      setPercentageInputs((prev) => ({ ...prev, [targetId]: "0" }));
    }
  }, [percentageInputs, updateDraftAllocation]);

  // Get the display value for percentage input
  const getPercentageInputValue = useCallback((targetId: string, percentage: number): string => {
    if (percentageInputs[targetId] !== undefined) {
      return percentageInputs[targetId];
    }
    return String(percentage);
  }, [percentageInputs]);

  // Handle +/- button clicks
  const handlePercentageStep = useCallback((targetId: string, currentPercentage: number, step: number) => {
    const newValue = Math.max(0, Math.min(100, currentPercentage + step));
    updateDraftAllocation(targetId, newValue);
    setPercentageInputs((prev) => ({ ...prev, [targetId]: String(newValue) }));
  }, [updateDraftAllocation]);

  // Auto-balance allocations to 100%
  const handleAutoBalance = useCallback(async () => {
    if (!donationDraft || donationDraft.allocations.length === 0) return;

    const lockedIds = donationDraft.lockedIds || [];

    // Separate locked and unlocked allocations
    const lockedAllocations = donationDraft.allocations.filter((a) => lockedIds.includes(a.targetId));
    const unlockedAllocations = donationDraft.allocations.filter((a) => !lockedIds.includes(a.targetId));

    // Calculate total locked percentage
    const lockedTotal = lockedAllocations.reduce((sum, a) => sum + a.percentage, 0);

    // Remaining percentage to distribute among unlocked items
    const remainingPercentage = Math.max(0, 100 - lockedTotal);
    const unlockedCount = unlockedAllocations.length;

    if (unlockedCount === 0) return; // Nothing to balance

    const evenPercentage = Math.floor(remainingPercentage / unlockedCount);
    const remainder = remainingPercentage - evenPercentage * unlockedCount;

    // Create balanced allocations preserving locked values
    const balancedAllocations = donationDraft.allocations.map((a) => {
      if (lockedIds.includes(a.targetId)) {
        return a; // Keep locked items unchanged
      }
      // Find index among unlocked items to assign remainder to first one
      const unlockedIndex = unlockedAllocations.findIndex((u) => u.targetId === a.targetId);
      return {
        ...a,
        percentage: unlockedIndex === 0 ? evenPercentage + remainder : evenPercentage,
      };
    });

    await saveDonationDraft({
      ...donationDraft,
      allocations: balancedAllocations,
    });

    // Clear input cache to show new values
    setPercentageInputs({});
  }, [donationDraft, saveDonationDraft]);

  // Generate a smart rebalance suggestion when removing an allocation
  const generateRemovalRebalanceSuggestion = useCallback((
    remainingAllocations: DraftAllocation[],
    freedPercentage: number,
    lockedIds: string[] = []
  ): DraftAllocation[] => {
    // Separate locked and unlocked allocations
    const lockedAllocations = remainingAllocations.filter((a) => lockedIds.includes(a.targetId));
    const unlockedAllocations = remainingAllocations.filter((a) => !lockedIds.includes(a.targetId));

    // If no unlocked allocations, can't redistribute - return as-is
    if (unlockedAllocations.length === 0) {
      return remainingAllocations;
    }

    const unlockedTotal = unlockedAllocations.reduce((sum, item) => sum + item.percentage, 0);

    // Redistribute freed percentage among unlocked items only
    if (unlockedTotal === 0) {
      // All unlocked items have 0%, distribute equally
      const equalPercentage = Math.floor((100 - lockedAllocations.reduce((s, a) => s + a.percentage, 0)) / unlockedAllocations.length);
      const remainder = (100 - lockedAllocations.reduce((s, a) => s + a.percentage, 0)) - (equalPercentage * unlockedAllocations.length);

      let firstAssigned = false;
      return remainingAllocations.map((alloc) => {
        if (lockedIds.includes(alloc.targetId)) {
          return alloc; // Locked items stay unchanged
        }
        const pct = !firstAssigned ? equalPercentage + remainder : equalPercentage;
        firstAssigned = true;
        return { ...alloc, percentage: pct };
      });
    }

    // Distribute freed percentage proportionally among unlocked items
    return remainingAllocations.map((alloc, index) => {
      if (lockedIds.includes(alloc.targetId)) {
        return alloc; // Locked items stay unchanged
      }

      const proportion = alloc.percentage / unlockedTotal;
      const additionalPercentage = Math.round(freedPercentage * proportion);

      // Handle rounding for last unlocked item
      const unlockedIndex = unlockedAllocations.findIndex((u) => u.targetId === alloc.targetId);
      if (unlockedIndex === unlockedAllocations.length - 1) {
        const lockedTotal = lockedAllocations.reduce((sum, a) => sum + a.percentage, 0);
        const othersTotal = remainingAllocations
          .filter((a) => !lockedIds.includes(a.targetId) && a.targetId !== alloc.targetId)
          .reduce((sum, a) => {
            const prop = a.percentage / unlockedTotal;
            return sum + a.percentage + Math.round(freedPercentage * prop);
          }, 0);
        return {
          ...alloc,
          percentage: 100 - lockedTotal - othersTotal,
        };
      }

      return {
        ...alloc,
        percentage: alloc.percentage + additionalPercentage,
      };
    });
  }, []);

  // State for showing "unlock items" warning when removing only unlocked item
  const [unlockWarning, setUnlockWarning] = useState<{ targetId: string; targetName: string } | null>(null);

  // Handle removal with smart rebalance suggestion
  const handleRemoveWithSuggestion = useCallback((targetId: string) => {
    if (!donationDraft) return;

    const itemToRemove = donationDraft.allocations.find((a) => a.targetId === targetId);
    if (!itemToRemove) return;

    const lockedIds = donationDraft.lockedIds || [];
    const remainingAllocations = donationDraft.allocations.filter((a) => a.targetId !== targetId);
    const remainingLockedIds = lockedIds.filter((id) => id !== targetId);

    // If only one item left or removed item had 0%, just remove directly
    if (remainingAllocations.length === 0 || itemToRemove.percentage === 0) {
      removeFromDraft(targetId);
      return;
    }

    // Check if this is the only unlocked item and there are locked items remaining
    const isOnlyUnlockedItem = !lockedIds.includes(targetId) &&
      remainingAllocations.every((a) => remainingLockedIds.includes(a.targetId));

    if (isOnlyUnlockedItem && remainingAllocations.length > 0) {
      // Show warning - user needs to unlock at least one item
      setUnlockWarning({ targetId, targetName: itemToRemove.targetName });
      return;
    }

    // Generate smart rebalance suggestion for remaining items
    const suggestedAllocations = generateRemovalRebalanceSuggestion(
      remainingAllocations,
      itemToRemove.percentage,
      remainingLockedIds
    );

    setRemovalSuggestion({
      allocations: suggestedAllocations,
      removedItemName: itemToRemove.targetName,
      removedPercentage: itemToRemove.percentage,
    });
  }, [donationDraft, removeFromDraft, generateRemovalRebalanceSuggestion]);

  // Handle unlocking all items and proceeding with removal
  const handleUnlockAllAndRemove = useCallback(async () => {
    if (!donationDraft || !unlockWarning) return;

    // Clear all locks first
    await saveDonationDraft({
      ...donationDraft,
      lockedIds: undefined,
    });

    // Clear warning and trigger removal again
    const targetId = unlockWarning.targetId;
    setUnlockWarning(null);

    // Now proceed with removal (will work since nothing is locked)
    setTimeout(() => {
      handleRemoveWithSuggestion(targetId);
    }, 100);
  }, [donationDraft, unlockWarning, saveDonationDraft, handleRemoveWithSuggestion]);

  // Accept removal rebalance suggestion - uses shared context function
  const handleAcceptRemovalRebalance = useCallback(async () => {
    await applyRemovalSuggestion();
    setPercentageInputs({});
  }, [applyRemovalSuggestion]);

  // Decline removal rebalance - uses shared context function (just removes without rebalancing)
  const handleDeclineRemovalRebalance = useCallback(async () => {
    await declineRemovalSuggestion();
  }, [declineRemovalSuggestion]);

  // Accept add rebalance suggestion - uses shared context function
  const handleAcceptRebalance = useCallback(async () => {
    await applyRebalanceSuggestion();
    setPercentageInputs({});
  }, [applyRebalanceSuggestion]);

  // Decline add rebalance - uses shared context function (keeps items at 0%)
  const handleDeclineRebalance = useCallback(async () => {
    await declineRebalanceSuggestion();
  }, [declineRebalanceSuggestion]);

  // Cancel removal - dismiss suggestion without removing item
  const handleCancelRemoval = useCallback(() => {
    setRemovalSuggestion(null);
  }, [setRemovalSuggestion]);

  // Calculate total percentage for draft allocations
  const totalDraftPercentage = donationDraft?.allocations.reduce(
    (sum, a) => sum + a.percentage,
    0
  ) || 0;

  const handleProceedToDonate = () => {
    // Store cart items in sessionStorage for the donate page to pick up
    // The donate page will handle the percentage allocation
    const cartData = cartItems.map(item => ({
      nonprofitId: item.nonprofitId,
      categoryId: item.categoryId,
      nonprofit: item.nonprofit,
      category: item.category,
    }));
    sessionStorage.setItem("donorx_cart_checkout", JSON.stringify(cartData));

    // Create a draft immediately so the giving list shows "active donation"
    // Distribute percentages evenly across all items
    const itemCount = cartItems.length;
    const evenPercentage = Math.floor(100 / itemCount);
    const remainder = 100 - evenPercentage * itemCount;

    const draftAllocations = cartItems.map((item, index) => ({
      type: (item.nonprofitId ? "nonprofit" : "category") as "nonprofit" | "category",
      targetId: (item.nonprofitId || item.categoryId)!,
      targetName: item.nonprofit?.name || item.category?.name || "Unknown",
      percentage: index === 0 ? evenPercentage + remainder : evenPercentage,
      logoUrl: item.nonprofit?.logoUrl,
      icon: item.category?.icon,
    }));

    // Save draft with default amount (will be updated on donate page)
    saveDonationDraft({
      amountCents: 10000000, // $100,000 default
      frequency: "one-time",
      allocations: draftAllocations,
    }).catch(error => console.error("Error saving draft:", error));

    // Close sidebar first, then navigate
    setSidebarOpen(false);

    // Clear cart in background (don't await - let navigation happen immediately)
    clearCart().catch(error => console.error("Error clearing cart:", error));

    // Navigate to donate page
    router.push("/donate?from=cart");
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      await clearCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleContinueDonation = () => {
    setSidebarOpen(false);
    router.push("/donate");
  };

  const handleClearDraftAndStartOver = async () => {
    setIsClearingDraft(true);
    // Check if on donate page (usePathname returns path without query params)
    const shouldRedirect = pathname === "/donate";
    try {
      await clearDonationDraft();
    } catch (error) {
      console.error("Error clearing draft:", error);
    } finally {
      setIsClearingDraft(false);
      // Close sidebar after clearing
      setSidebarOpen(false);
    }
    // Always redirect to directory if on donate page (even if clearing failed)
    // Do this after the finally block to ensure state updates complete
    if (shouldRedirect) {
      router.push("/directory");
    }
  };

  // If there's an active draft, show "Your Giving List" with allocation items
  if (hasDraft && donationDraft) {
    return (
      <div className="flex h-full flex-col">
        {/* Header with Summary */}
        <div className="border-b border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-emerald-600" />
              Your Giving List
            </h3>
            <span className="text-sm text-slate-500">
              {donationDraft.allocations.length} item{donationDraft.allocations.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleContinueDonation}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              Finalize Donation
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleClearDraftAndStartOver}
              disabled={isClearingDraft}
              size="sm"
              className="text-slate-600"
            >
              {isClearingDraft ? "Clearing..." : "Clear"}
            </Button>
          </div>
        </div>

        {/* Allocation Progress Bar */}
        <div className="px-4 pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Allocation</span>
            <span
              className={`text-xs font-medium ${
                totalDraftPercentage === 100
                  ? "text-emerald-600"
                  : totalDraftPercentage > 100
                  ? "text-red-600"
                  : "text-slate-500"
              }`}
            >
              {totalDraftPercentage}% allocated
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all ${
                totalDraftPercentage === 100
                  ? "bg-emerald-600"
                  : totalDraftPercentage > 100
                  ? "bg-red-600"
                  : "bg-blue-600"
              }`}
              style={{ width: `${Math.min(totalDraftPercentage, 100)}%` }}
            />
          </div>
          {/* Status text and Auto-balance button */}
          {totalDraftPercentage !== 100 && donationDraft.allocations.length > 0 && (
            <div className="flex items-center justify-between mt-1.5">
              <div>
                {totalDraftPercentage < 100 && (
                  <span className="text-xs text-slate-500">
                    {100 - totalDraftPercentage}% remaining
                  </span>
                )}
                {totalDraftPercentage > 100 && (
                  <span className="text-xs text-red-600">
                    Over-allocated by {totalDraftPercentage - 100}%
                  </span>
                )}
              </div>
              <button
                onClick={handleAutoBalance}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Auto-balance
              </button>
            </div>
          )}
        </div>

        {/* Allocation Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {donationDraft.allocations.map((allocation) => (
              <div
                key={allocation.targetId}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                {/* Top row: Logo, Name, Remove button */}
                <div className="flex items-center gap-3 mb-2">
                  {/* Logo/Icon */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
                    {allocation.type === "category" ? (
                      allocation.icon ? (
                        <span className="text-lg">{allocation.icon}</span>
                      ) : (
                        <Tag className="h-4 w-4 text-slate-400" />
                      )
                    ) : allocation.logoUrl ? (
                      <img
                        src={allocation.logoUrl}
                        alt={allocation.targetName}
                        className="h-9 w-9 rounded-lg object-contain"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-600">
                        {allocation.targetName.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Name and type */}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-slate-900">
                      {allocation.targetName}
                    </h4>
                    <p className="text-xs text-slate-500 capitalize">
                      {allocation.type}
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveWithSuggestion(allocation.targetId)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Remove from giving list"
                    disabled={!!rebalanceSuggestion || !!removalSuggestion}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Bottom row: Percentage controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePercentageStep(allocation.targetId, allocation.percentage, -1)}
                    disabled={allocation.percentage <= 0 || isLocked(allocation.targetId)}
                    className="h-7 w-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <div className="relative w-14 flex-shrink-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={getPercentageInputValue(allocation.targetId, allocation.percentage)}
                      onChange={(e) => handlePercentageInputChange(allocation.targetId, e.target.value)}
                      onBlur={() => handlePercentageInputBlur(allocation.targetId)}
                      disabled={isLocked(allocation.targetId)}
                      className={`w-full h-7 rounded border pl-1 pr-5 text-center text-base font-medium ${
                        isLocked(allocation.targetId)
                          ? "border-amber-300 bg-amber-50"
                          : "border-slate-200"
                      }`}
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
                  </div>
                  <button
                    onClick={() => handlePercentageStep(allocation.targetId, allocation.percentage, 1)}
                    disabled={allocation.percentage >= 100 || isLocked(allocation.targetId)}
                    className="h-7 w-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  {/* Lock button */}
                  <button
                    onClick={() => toggleLockAllocation(allocation.targetId)}
                    disabled={!canLock(allocation.targetId)}
                    className={`h-7 w-7 rounded border flex items-center justify-center transition-colors ${
                      isLocked(allocation.targetId)
                        ? "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
                        : canLock(allocation.targetId)
                        ? "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                        : "border-slate-100 text-slate-300 cursor-not-allowed"
                    }`}
                    title={
                      isLocked(allocation.targetId)
                        ? "Unlock"
                        : canLock(allocation.targetId)
                        ? "Lock"
                        : "Cannot lock all items"
                    }
                  >
                    {isLocked(allocation.targetId) ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </button>
                  {/* Mini progress bar */}
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(allocation.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Rebalance Suggestion (Adding) */}
          {rebalanceSuggestion && (
            <div className="mt-3 p-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 space-y-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 flex-shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-emerald-900 text-sm">AI Suggested Rebalance</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Adding{" "}
                    {rebalanceSuggestion.newItemNames.map((name, i) => (
                      <span key={name}>
                        <span className="font-medium">{name}</span>
                        {i < rebalanceSuggestion.newItemNames.length - 2 && ", "}
                        {i === rebalanceSuggestion.newItemNames.length - 2 && " and "}
                      </span>
                    ))}{" "}
                    to your allocation. Here&apos;s a recommended distribution:
                  </p>
                </div>
              </div>

              {/* Suggested allocation preview */}
              <div className="space-y-1.5">
                {rebalanceSuggestion.allocations.map((alloc) => {
                  const isNewItem = !donationDraft?.allocations.some((a) => a.targetId === alloc.targetId);
                  return (
                    <div
                      key={alloc.targetId}
                      className={`flex items-center justify-between text-xs py-1.5 px-2 rounded ${
                        isNewItem
                          ? "bg-emerald-100 border border-emerald-200"
                          : "bg-white/60"
                      }`}
                    >
                      <span className={`truncate mr-2 ${
                        isNewItem ? "font-medium text-emerald-900" : "text-slate-700"
                      }`}>
                        {alloc.targetName}
                        {isNewItem && (
                          <span className="ml-1 text-emerald-600">(new)</span>
                        )}
                      </span>
                      <span className="font-medium text-slate-900">{alloc.percentage}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Accept/Decline buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptRebalance}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Apply Suggestion
                </Button>
                <Button
                  onClick={handleDeclineRebalance}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Manual Adjust
                </Button>
              </div>
            </div>
          )}

          {/* Unlock Warning - shown when trying to remove the only unlocked item */}
          {unlockWarning && (
            <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 space-y-3 relative">
              <button
                onClick={() => setUnlockWarning(null)}
                className="absolute top-2 right-2 p-1 rounded-full text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-start gap-2 pr-5">
                <div className="p-1.5 rounded-lg bg-amber-100 flex-shrink-0">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-amber-900 text-sm">
                    Cannot Redistribute
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    <span className="font-medium">{unlockWarning.targetName}</span> is the only unlocked item.
                    Unlock at least one other item to redistribute percentages.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUnlockAllAndRemove}
                  size="sm"
                  className="flex-1 h-8 text-xs bg-amber-600 hover:bg-amber-700"
                >
                  <Unlock className="h-3 w-3 mr-1" />
                  Unlock All & Remove
                </Button>
                <Button
                  onClick={() => setUnlockWarning(null)}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* AI Rebalance Suggestion (Removing) */}
          {removalSuggestion && !unlockWarning && (
            <div className="mt-3 p-3 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 space-y-3 relative">
              {/* Cancel/dismiss button */}
              <button
                onClick={handleCancelRemoval}
                className="absolute top-2 right-2 p-1 rounded-full text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                title="Cancel removal"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-start gap-2 pr-5">
                <div className="p-1.5 rounded-lg bg-emerald-100 flex-shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-emerald-900 text-sm">
                    Redistribute {removalSuggestion.removedPercentage}%?
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Removing <span className="font-medium">{removalSuggestion.removedItemName}</span> frees up {removalSuggestion.removedPercentage}%.
                    Here&apos;s a suggested redistribution:
                  </p>
                </div>
              </div>

              {/* Suggested allocation preview */}
              <div className="space-y-1.5">
                {removalSuggestion.allocations.map((alloc) => {
                  const original = donationDraft?.allocations.find((a) => a.targetId === alloc.targetId);
                  const change = original ? alloc.percentage - original.percentage : 0;
                  return (
                    <div
                      key={alloc.targetId}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-white/60"
                    >
                      <span className="truncate mr-2 text-slate-700">
                        {alloc.targetName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {change > 0 && (
                          <span className="text-emerald-600 font-medium">+{change}%</span>
                        )}
                        <span className="font-medium text-slate-900">{alloc.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Accept/Decline buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptRemovalRebalance}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Apply Redistribution
                </Button>
                <Button
                  onClick={handleDeclineRemovalRebalance}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Just Remove
                </Button>
              </div>
            </div>
          )}

          {/* Tip - only show when no suggestions are active */}
          {!rebalanceSuggestion && !removalSuggestion && !unlockWarning && (
            <p className="mt-4 text-xs text-slate-400 text-center">
              Browse the directory to add more nonprofits or categories
            </p>
          )}
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-slate-100 p-4">
          <HandHeart className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-slate-900">
          Your giving list is empty
        </h3>
        <p className="mb-6 text-sm text-slate-500">
          Browse the directory and add nonprofits or categories to quickly
          build your donation allocation.
        </p>
        <Link href="/directory" onClick={() => setSidebarOpen(false)}>
          <Button>Browse Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sticky Header with Proceed Button */}
      <div className="border-b border-slate-200 bg-white p-4 shadow-sm">
        <Button
          onClick={handleProceedToDonate}
          className="w-full mb-3"
          size="lg"
        >
          Proceed to Donate
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-xs text-slate-500 text-center">
          Set your donation amount and allocation percentages on the next page.
        </p>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={handleClearCart}
            disabled={isClearing}
            className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
          >
            {isClearing ? "Clearing..." : "Clear all"}
          </button>
        </div>

        <div className="space-y-2">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              {/* Logo/Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
                {item.nonprofit?.logoUrl ? (
                  <img
                    src={item.nonprofit.logoUrl}
                    alt={item.nonprofit.name}
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                ) : item.category?.icon ? (
                  <span className="text-xl">{item.category.icon}</span>
                ) : item.nonprofit ? (
                  <span className="text-lg font-semibold text-slate-600">
                    {item.nonprofit.name.charAt(0)}
                  </span>
                ) : (
                  <Tag className="h-5 w-5 text-slate-400" />
                )}
              </div>

              {/* Name and Type */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium text-slate-900">
                  {item.nonprofit?.name || item.category?.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {item.nonprofit ? "Nonprofit" : "Category"}
                </p>
              </div>

              {/* Quick View button (nonprofits only) */}
              {item.nonprofitId && (
                <button
                  onClick={() => setQuickViewItem(item)}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  title="Quick view"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}

              {/* Remove button */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Remove from giving list"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Quick View Modal */}
        {quickViewItem && quickViewItem.nonprofit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setQuickViewItem(null)}
            />
            {/* Modal */}
            <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-start gap-4 p-4 border-b border-slate-200">
                {quickViewItem.nonprofit.logoUrl ? (
                  <img
                    src={quickViewItem.nonprofit.logoUrl}
                    alt={quickViewItem.nonprofit.name}
                    className="h-14 w-14 rounded-xl object-contain border border-slate-200"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xl">
                    {quickViewItem.nonprofit.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900">
                    {quickViewItem.nonprofit.name}
                  </h3>
                  <p className="text-sm text-slate-500">Nonprofit</p>
                </div>
                <button
                  onClick={() => setQuickViewItem(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4">
                {quickViewItem.nonprofit.mission ? (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Mission</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {quickViewItem.nonprofit.mission}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No mission statement available.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setQuickViewItem(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link
                    href={`/directory/${quickViewItem.nonprofitId}`}
                    onClick={() => {
                      setQuickViewItem(null);
                      setSidebarOpen(false);
                    }}
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Full Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
