"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, AlertCircle, RefreshCw, Save, FolderOpen, Trash2, X, LogIn, Pencil, Check, Layers, Building2, Tag, DollarSign, Heart, ChevronDown } from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AmountInput } from "@/components/donation/amount-input";
import { AllocationBuilder, type AllocationItem } from "@/components/donation/allocation-builder";
import { FrequencySelector, type DonationFrequency } from "@/components/donation/frequency-selector";
import { type Allocation as AIAllocation } from "@/components/ai/allocation-advisor";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createCheckoutSession, saveTemplate, updateTemplate, loadTemplates, deleteTemplate, renameTemplate, type AllocationInput, type DonationTemplate, type TemplateItem, type SaveTemplateResult } from "./actions";
import { useCartFavorites, type DraftAllocation, type DonationDraft } from "@/contexts/cart-favorites-context";
import { useToast } from "@/components/ui/toast";
import type { Nonprofit, Category } from "@/types/database";

interface CartCheckoutItem {
  nonprofitId?: string;
  categoryId?: string;
  nonprofit?: { name: string };
  category?: { name: string };
}

interface DonateClientProps {
  nonprofits: Nonprofit[];
  categories: Category[];
  preselectedNonprofitId?: string;
  initialTemplate?: DonationTemplate;
  isAuthenticated?: boolean;
}

export function DonateClient({
  nonprofits,
  categories,
  preselectedNonprofitId,
  initialTemplate,
  isAuthenticated = false,
}: DonateClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";

  const { donationDraft, saveDonationDraft, clearDonationDraft, rebalanceSuggestion, setRebalanceSuggestion, applyRebalanceSuggestion, declineRebalanceSuggestion, removalSuggestion, setRemovalSuggestion, applyRemovalSuggestion, declineRemovalSuggestion, toggleLockAllocation, isLocked, canLock } = useCartFavorites();
  const { addToast } = useToast();
  const [draftLoaded, setDraftLoaded] = React.useState(false);
  // Track if allocations were loaded from a draft (vs preselected nonprofit or cart)
  const [loadedFromDraft, setLoadedFromDraft] = React.useState(false);
  // Track the last draft we saved to avoid syncing our own changes back
  const lastSavedDraftRef = React.useRef<string | null>(null);
  // Track when proceeding to payment to prevent redirect on draft clear
  const proceedingToPaymentRef = React.useRef(false);
  // Track current lockedIds to avoid stale closure in auto-save effect
  const lockedIdsRef = React.useRef<string[] | undefined>(undefined);

  const [amount, setAmount] = React.useState(75000); // Start with $75K (first preset of tier 3)
  const [frequency, setFrequency] = React.useState<DonationFrequency>("one-time");
  const [allocations, setAllocations] = React.useState<AllocationItem[]>([]);

  // Initialize allocations from template, cart, preselected nonprofit, or draft
  React.useEffect(() => {
    // Only run once on mount
    if (draftLoaded) return;

    // Highest priority: initialTemplate from URL parameter (from "Use Template" button)
    if (initialTemplate && initialTemplate.items.length > 0) {
      const templateAllocations: AllocationItem[] = initialTemplate.items.map((item) => ({
        id: crypto.randomUUID(),
        type: item.type,
        targetId: item.targetId,
        targetName: item.targetName,
        percentage: item.percentage,
      }));
      setAllocations(templateAllocations);

      // Load amount and frequency if saved with template
      if (initialTemplate.amountCents) {
        setAmount(initialTemplate.amountCents / 100);
      }
      if (initialTemplate.frequency) {
        setFrequency(initialTemplate.frequency);
      }

      setDraftLoaded(true);
      return;
    }

    const fromCart = searchParams.get("from") === "cart";

    // If coming from cart, load items from sessionStorage (second priority)
    if (fromCart) {
      try {
        const cartData = sessionStorage.getItem("donorx_cart_checkout");
        if (cartData) {
          const cartItems: CartCheckoutItem[] = JSON.parse(cartData);
          const itemCount = cartItems.length;

          // Distribute percentages evenly across all items
          const evenPercentage = Math.floor(100 / itemCount);
          const remainder = 100 - evenPercentage * itemCount;

          const cartAllocations: AllocationItem[] = cartItems
            .filter(item => item.nonprofitId || item.categoryId)
            .map((item, index) => ({
              id: crypto.randomUUID(),
              type: item.nonprofitId ? "nonprofit" as const : "category" as const,
              targetId: (item.nonprofitId || item.categoryId)!,
              targetName: item.nonprofit?.name || item.category?.name || "Unknown",
              // Give remainder to first item so total is exactly 100%
              percentage: index === 0 ? evenPercentage + remainder : evenPercentage,
            }));

          if (cartAllocations.length > 0) {
            setAllocations(cartAllocations);
            // Clear the checkout data
            sessionStorage.removeItem("donorx_cart_checkout");
            setDraftLoaded(true);
            return;
          }
        }
      } catch (error) {
        console.error("Error loading cart data:", error);
      }
    }

    // Check for preselected nonprofit (third priority)
    if (preselectedNonprofitId) {
      const nonprofit = nonprofits.find((n) => n.id === preselectedNonprofitId);
      if (nonprofit) {
        setAllocations([
          {
            id: crypto.randomUUID(),
            type: "nonprofit",
            targetId: nonprofit.id,
            targetName: nonprofit.name,
            percentage: 100,
          },
        ]);
        setDraftLoaded(true);
        return;
      }
    }

    // Otherwise, restore from draft if available (lowest priority)
    if (donationDraft && donationDraft.allocations.length > 0) {
      setAmount(donationDraft.amountCents / 100);
      setFrequency(donationDraft.frequency);
      setAllocations(
        donationDraft.allocations.map((a) => ({
          id: crypto.randomUUID(),
          type: a.type,
          targetId: a.targetId,
          targetName: a.targetName,
          percentage: a.percentage,
        }))
      );
      setLoadedFromDraft(true);
    }

    setDraftLoaded(true);
  }, [preselectedNonprofitId, nonprofits, searchParams, donationDraft, draftLoaded, initialTemplate]);

  // Keep lockedIds ref in sync with donationDraft
  React.useEffect(() => {
    lockedIdsRef.current = donationDraft?.lockedIds;
  }, [donationDraft?.lockedIds]);

  // Redirect when draft is cleared externally (e.g., from "Clear & Start Over" on another device)
  // Only redirect if the allocations were originally loaded from a draft
  // Don't redirect if user is proceeding to payment (they cleared draft intentionally)
  React.useEffect(() => {
    if (draftLoaded && loadedFromDraft && donationDraft === null && allocations.length > 0 && !proceedingToPaymentRef.current) {
      // Draft was cleared externally - redirect to directory
      console.log('[Donate] Draft cleared on another device, redirecting to directory');
      router.push('/directory');
    }
  }, [donationDraft, draftLoaded, loadedFromDraft, allocations.length, router]);

  // Sync incoming draft changes from other devices (realtime)
  React.useEffect(() => {
    // Don't sync until initial load is complete
    if (!draftLoaded) return;
    // Skip if no draft
    if (!donationDraft) return;

    // Create fingerprint of incoming draft (excluding IDs, just content)
    const incomingFingerprint = JSON.stringify({
      a: donationDraft.amountCents,
      f: donationDraft.frequency,
      allocs: donationDraft.allocations.map(a => `${a.type}:${a.targetId}:${a.percentage}`).sort(),
    });

    // If this matches what we last saved, it's our own change echoing back - skip
    if (lastSavedDraftRef.current === incomingFingerprint) {
      return;
    }

    // This is a change from another device - sync it
    console.log('[Donate] Syncing draft from another device');
    setAmount(donationDraft.amountCents / 100);
    setFrequency(donationDraft.frequency);
    setAllocations(
      donationDraft.allocations.map((a) => ({
        id: crypto.randomUUID(),
        type: a.type,
        targetId: a.targetId,
        targetName: a.targetName,
        percentage: a.percentage,
      }))
    );
    // Update the ref so we don't echo this back
    lastSavedDraftRef.current = incomingFingerprint;
  }, [donationDraft, draftLoaded]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Helper function to save donation state and redirect to login
  const saveStateAndRedirectToLogin = React.useCallback((action: "checkout" | "save-template") => {
    // Store current donation state in sessionStorage for recovery after login
    const donationState = {
      amount,
      frequency,
      allocations: allocations.map((a) => ({
        type: a.type,
        targetId: a.targetId,
        targetName: a.targetName,
        percentage: a.percentage,
      })),
      action, // Track what user was trying to do
    };
    sessionStorage.setItem("donorx_pending_donation", JSON.stringify(donationState));

    // Redirect to login with return URL
    router.push(`/login?redirect=/donate&action=${action}`);
  }, [amount, frequency, allocations, router]);

  // Template state
  const [templates, setTemplates] = React.useState<DonationTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = React.useState(false);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = React.useState(false);
  const [templateName, setTemplateName] = React.useState("");
  const [templateDescription, setTemplateDescription] = React.useState("");
  const [saveIncludeAmount, setSaveIncludeAmount] = React.useState(false);
  const [saveIncludeFrequency, setSaveIncludeFrequency] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("new"); // "new" or existing template ID
  const [editingTemplateId, setEditingTemplateId] = React.useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = React.useState("");
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = React.useState<string | null>(null);

  // Color palette for allocation bar
  const allocationColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  // Load templates on mount
  React.useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      const result = await loadTemplates();
      if (result.success && result.templates) {
        setTemplates(result.templates);
      }
      setIsLoadingTemplates(false);
    };
    fetchTemplates();
  }, []);

  // Restore donation state after login redirect
  React.useEffect(() => {
    if (!isAuthenticated) return;

    try {
      const pendingDonation = sessionStorage.getItem("donorx_pending_donation");
      if (pendingDonation) {
        const state = JSON.parse(pendingDonation);
        setAmount(state.amount);
        setFrequency(state.frequency);
        if (state.allocations && state.allocations.length > 0) {
          setAllocations(
            state.allocations.map((a: { type: "nonprofit" | "category"; targetId: string; targetName: string; percentage: number }) => ({
              id: crypto.randomUUID(),
              type: a.type,
              targetId: a.targetId,
              targetName: a.targetName,
              percentage: a.percentage,
            }))
          );
        }
        // Clear the stored state
        sessionStorage.removeItem("donorx_pending_donation");

        // If user was trying to save a template, open the modal
        if (state.action === "save-template") {
          // Small delay to ensure state is updated
          setTimeout(() => setShowSaveModal(true), 100);
        }
        // For checkout, user can click button again now that they're logged in
      }
    } catch (error) {
      console.error("Error restoring donation state:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Auto-save draft when donation state changes
  React.useEffect(() => {
    // Don't save until initial load is complete
    if (!draftLoaded) return;

    // If all allocations were removed, clear draft and redirect to directory
    if (allocations.length === 0 && loadedFromDraft && !proceedingToPaymentRef.current) {
      clearDonationDraft();
      router.push('/directory');
      return;
    }

    // Save draft with current state (even if no allocations yet)
    // This preserves amount/frequency if user navigates away
    const draft: DonationDraft = {
      amountCents: amount * 100,
      frequency,
      allocations: allocations.map((a) => {
        // Look up logo/icon from the nonprofits/categories arrays
        let logoUrl: string | undefined;
        let icon: string | undefined;

        if (a.type === "nonprofit") {
          const nonprofit = nonprofits.find((n) => n.id === a.targetId);
          logoUrl = nonprofit?.logo_url || undefined;
        } else {
          const category = categories.find((c) => c.id === a.targetId);
          icon = category?.icon || undefined;
        }

        return {
          type: a.type,
          targetId: a.targetId,
          targetName: a.targetName,
          percentage: a.percentage,
          logoUrl,
          icon,
        };
      }),
      // Preserve locked IDs using ref (avoids stale closure issue)
      lockedIds: lockedIdsRef.current,
    };

    // Track what we're saving so we don't sync our own changes back
    lastSavedDraftRef.current = JSON.stringify({
      a: draft.amountCents,
      f: draft.frequency,
      allocs: draft.allocations.map(a => `${a.type}:${a.targetId}:${a.percentage}`).sort(),
    });

    saveDonationDraft(draft);
  }, [amount, frequency, allocations, draftLoaded, loadedFromDraft, saveDonationDraft, clearDonationDraft, router, nonprofits, categories]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setTemplateError("Please enter a template name");
      return;
    }

    setIsSaving(true);
    setTemplateError(null);

    const items: TemplateItem[] = allocations.map((a) => ({
      type: a.type,
      targetId: a.targetId,
      targetName: a.targetName,
      percentage: a.percentage,
    }));

    let result: SaveTemplateResult;
    if (selectedTemplateId === "new") {
      // Create new template
      result = await saveTemplate(
        templateName,
        items,
        templateDescription || undefined,
        saveIncludeAmount ? amountCents : undefined,
        saveIncludeFrequency ? frequency : undefined
      );

      if (result.success && result.template) {
        setTemplates((prev) => [result.template!, ...prev]);
      }
    } else {
      // Update existing template
      result = await updateTemplate(
        selectedTemplateId,
        templateName,
        items,
        templateDescription || undefined,
        saveIncludeAmount ? amountCents : undefined,
        saveIncludeFrequency ? frequency : undefined
      );

      if (result.success && result.template) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === selectedTemplateId ? result.template! : t))
        );
      }
    }

    if (result.success) {
      setShowSaveModal(false);
      setTemplateName("");
      setTemplateDescription("");
      setSaveIncludeAmount(false);
      setSaveIncludeFrequency(false);
      setSelectedTemplateId("new");
    } else {
      setTemplateError(result.error || "Failed to save template");
    }

    setIsSaving(false);
  };

  // When selecting an existing template to overwrite, populate the form
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId !== "new") {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setTemplateName(template.name);
        setTemplateDescription(template.description || "");
        setSaveIncludeAmount(!!template.amountCents);
        setSaveIncludeFrequency(!!template.frequency);
      }
    } else {
      setTemplateName("");
      setTemplateDescription("");
      setSaveIncludeAmount(false);
      setSaveIncludeFrequency(false);
    }
  };

  const handleLoadTemplate = (template: DonationTemplate) => {
    // Convert template items to allocation items
    const newAllocations: AllocationItem[] = template.items.map((item) => ({
      id: crypto.randomUUID(),
      type: item.type,
      targetId: item.targetId,
      targetName: item.targetName,
      percentage: item.percentage,
    }));

    setAllocations(newAllocations);

    // Optionally load amount and frequency if saved
    if (template.amountCents) {
      setAmount(template.amountCents / 100);
    }
    if (template.frequency) {
      setFrequency(template.frequency);
    }

    setShowTemplatesModal(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const result = await deleteTemplate(templateId);
    if (result.success) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  };

  const handleStartRename = (template: DonationTemplate) => {
    setEditingTemplateId(template.id);
    setEditingTemplateName(template.name);
  };

  const handleCancelRename = () => {
    setEditingTemplateId(null);
    setEditingTemplateName("");
  };

  const handleSaveRename = async () => {
    if (!editingTemplateId || !editingTemplateName.trim()) return;

    setIsRenaming(true);
    const result = await renameTemplate(editingTemplateId, editingTemplateName.trim());

    if (result.success) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplateId ? { ...t, name: editingTemplateName.trim() } : t
        )
      );
      setEditingTemplateId(null);
      setEditingTemplateName("");
    } else {
      addToast(result.error || "Failed to rename template", "error");
    }
    setIsRenaming(false);
  };

  const isRecurring = frequency !== "one-time";

  const totalPercentage = allocations.reduce((sum, item) => sum + item.percentage, 0);
  const isValidAllocation = totalPercentage === 100;
  const amountCents = amount * 100;
  const isValidAmount = amountCents >= config.features.minDonationCents;

  // Handler for applying AI allocation recommendations
  const handleApplyAiAllocation = (aiAllocations: AIAllocation[]) => {
    // Convert AI allocations to AllocationItem format
    // AI returns category names (e.g., "Education", "Healthcare") which we need to match
    const newAllocations: AllocationItem[] = [];

    for (const aiAlloc of aiAllocations) {
      // Try to find a matching nonprofit by name (fuzzy match)
      const matchingNonprofit = nonprofits.find(
        (n) => n.name.toLowerCase().includes(aiAlloc.name.toLowerCase()) ||
               aiAlloc.name.toLowerCase().includes(n.name.toLowerCase())
      );

      // Try to find a matching category
      const matchingCategory = categories.find(
        (c) => c.name.toLowerCase() === aiAlloc.name.toLowerCase() ||
               aiAlloc.name.toLowerCase().includes(c.name.toLowerCase())
      );

      if (matchingNonprofit) {
        newAllocations.push({
          id: crypto.randomUUID(),
          type: "nonprofit",
          targetId: matchingNonprofit.id,
          targetName: matchingNonprofit.name,
          percentage: aiAlloc.percentage,
        });
      } else if (matchingCategory) {
        newAllocations.push({
          id: crypto.randomUUID(),
          type: "category",
          targetId: matchingCategory.id,
          targetName: matchingCategory.name,
          percentage: aiAlloc.percentage,
        });
      } else {
        // If no match found, try to use as category name directly
        // This handles cases where AI suggests categories like "Education"
        const categoryByName = categories.find(
          (c) => c.name.toLowerCase() === aiAlloc.name.toLowerCase()
        );
        if (categoryByName) {
          newAllocations.push({
            id: crypto.randomUUID(),
            type: "category",
            targetId: categoryByName.id,
            targetName: categoryByName.name,
            percentage: aiAlloc.percentage,
          });
        }
      }
    }

    // Only update if we found matches
    if (newAllocations.length > 0) {
      // Normalize percentages to sum to 100
      const totalPercentage = newAllocations.reduce((sum, a) => sum + a.percentage, 0);
      if (totalPercentage !== 100 && totalPercentage > 0) {
        const scale = 100 / totalPercentage;
        let remaining = 100;
        newAllocations.forEach((a, i) => {
          if (i === newAllocations.length - 1) {
            a.percentage = remaining;
          } else {
            a.percentage = Math.round(a.percentage * scale);
            remaining -= a.percentage;
          }
        });
      }
      setAllocations(newAllocations);
    }
  };

  const handleProceedToPayment = async () => {
    if (!isValidAllocation || !isValidAmount) return;

    // If not authenticated, save state and redirect to login
    if (!isAuthenticated) {
      saveStateAndRedirectToLogin("checkout");
      return;
    }

    setIsLoading(true);
    setError(null);

    const allocationInputs: AllocationInput[] = allocations.map((a) => ({
      type: a.type,
      targetId: a.targetId,
      targetName: a.targetName,
      percentage: a.percentage,
    }));

    try {
      const result = await createCheckoutSession(amountCents, allocationInputs, frequency);

      if (result.success && result.url) {
        // Mark that we're proceeding to payment to prevent redirect on draft clear
        proceedingToPaymentRef.current = true;
        // Clear the draft in background (don't await - let redirect happen immediately)
        clearDonationDraft().catch(console.error);
        // Redirect to Stripe Checkout (or success page for simulation mode)
        window.location.assign(result.url);
      } else {
        setError(result.error || "Something went wrong. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Failed to process payment. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/directory"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900">
            Make a Donation
          </h1>
          <p className="mt-2 text-slate-600">
            Allocate your contribution across multiple organizations
          </p>

          {/* Template Actions - Header */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {templates.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplatesModal(true)}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Template
              </Button>
            )}
            {allocations.length > 0 && isValidAllocation && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push("/login?redirect=/donate");
                  } else {
                    setShowSaveModal(true);
                  }
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
            )}
          </div>
        </div>

        {/* Canceled Notice */}
        {canceled && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Your payment was canceled. No charges were made. You can try again when ready.
            </p>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-8">
            {/* Amount Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Donation Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <AmountInput
                  value={amount}
                  onChange={setAmount}
                  minAmount={config.features.minDonationCents / 100}
                />
              </CardContent>
            </Card>

            {/* Frequency Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Donation Frequency</CardTitle>
                  {isRecurring && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Recurring
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <FrequencySelector value={frequency} onChange={setFrequency} />
                {isRecurring && (
                  <p className="mt-3 text-sm text-slate-500">
                    You can cancel or modify your recurring donation anytime from your dashboard.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Allocation Builder */}
            <AllocationBuilder
              allocations={allocations}
              onAllocationsChange={setAllocations}
              totalAmountCents={amountCents}
              nonprofits={nonprofits}
              categories={categories}
              donationAmount={amount}
              onApplyAiAllocation={handleApplyAiAllocation}
              sharedRebalanceSuggestion={rebalanceSuggestion}
              onApplySharedRebalance={applyRebalanceSuggestion}
              onDeclineSharedRebalance={declineRebalanceSuggestion}
              onSetSharedRebalance={setRebalanceSuggestion}
              sharedRemovalSuggestion={removalSuggestion}
              onApplySharedRemoval={applyRemovalSuggestion}
              onDeclineSharedRemoval={declineRemovalSuggestion}
              onSetSharedRemoval={setRemovalSuggestion}
              lockedIds={donationDraft?.lockedIds || []}
              onToggleLock={toggleLockAllocation}
              canLock={canLock}
            />
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Donation Amount</span>
                    <span className="font-medium">{formatCurrency(amountCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Frequency</span>
                    <span className="font-medium capitalize">
                      {frequency === "one-time" ? "One-time" : frequency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Platform Fee</span>
                    <span className="font-medium text-emerald-600">$0.00</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">
                        {formatCurrency(amountCents)}
                        {isRecurring && <span className="text-sm font-normal text-slate-500">/{frequency === "monthly" ? "mo" : frequency === "quarterly" ? "qtr" : "yr"}</span>}
                      </span>
                    </div>
                  </div>

                  {/* Allocation Summary */}
                  {allocations.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-sm font-medium text-slate-900 mb-3">
                        Allocation Breakdown
                      </p>
                      <div className="space-y-2">
                        {allocations.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-slate-600 truncate mr-2">
                              {item.targetName}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(Math.round((amountCents * item.percentage) / 100))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    fullWidth
                    size="lg"
                    disabled={!isValidAllocation || !isValidAmount || isLoading}
                    className="mt-4"
                    onClick={handleProceedToPayment}
                    loading={isLoading}
                  >
                    {!isAuthenticated ? (
                      <LogIn className="mr-2 h-4 w-4" />
                    ) : isRecurring ? (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    {isLoading
                      ? "Processing..."
                      : !isAuthenticated
                        ? "Sign in to Donate"
                        : isRecurring
                          ? "Set Up Recurring Donation"
                          : "Proceed to Payment"}
                  </Button>

                  {!isValidAllocation && allocations.length > 0 && (
                    <p className="text-sm text-red-600 text-center">
                      Please allocate exactly 100% of your donation
                    </p>
                  )}

                  {allocations.length === 0 && (
                    <p className="text-sm text-amber-600 text-center">
                      Add at least one nonprofit or category to your allocation
                    </p>
                  )}

                  {!isValidAmount && (
                    <p className="text-sm text-red-600 text-center">
                      Minimum donation is ${config.features.minDonationCents / 100}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 text-center">
                    Secured by Stripe. You&apos;ll receive a single tax receipt for
                    your entire donation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSaveModal(false)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Save as Template
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {templateError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                  {templateError}
                </div>
              )}

              {/* Template selector - create new or overwrite existing */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Save to
                  </label>
                  <div className="space-y-2">
                    {/* Create new option */}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTemplateId === "new"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="template-select"
                        value="new"
                        checked={selectedTemplateId === "new"}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-slate-900">Create new template</span>
                      </div>
                    </label>

                    {/* Existing templates */}
                    <div className="pt-2">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Or update existing
                      </span>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {templates.map((t) => (
                          <label
                            key={t.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedTemplateId === t.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              name="template-select"
                              value={t.id}
                              checked={selectedTemplateId === t.id}
                              onChange={(e) => handleTemplateSelect(e.target.value)}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <span className="text-slate-900">{t.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Monthly Giving, Holiday Donations"
                  disabled={selectedTemplateId !== "new"}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    selectedTemplateId !== "new"
                      ? "border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                      : "border-slate-300 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  }`}
                />
                {selectedTemplateId !== "new" && (
                  <p className="mt-1 text-xs text-slate-500">
                    Name is locked when updating an existing template
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Add notes about this template..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveIncludeAmount}
                    onChange={(e) => setSaveIncludeAmount(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Save donation amount ({formatCurrency(amountCents)})
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveIncludeFrequency}
                    onChange={(e) => setSaveIncludeFrequency(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Save frequency ({frequency === "one-time" ? "One-time" : frequency})
                  </span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-3">
                  {selectedTemplateId === "new"
                    ? `This will create a new template with your current allocation: ${allocations.length} item${allocations.length !== 1 ? "s" : ""}`
                    : `This will overwrite "${templates.find((t) => t.id === selectedTemplateId)?.name}" with your current allocation`}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowSaveModal(false);
                      setSelectedTemplateId("new");
                      setTemplateName("");
                      setTemplateDescription("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveTemplate}
                    disabled={isSaving || !templateName.trim()}
                    loading={isSaving}
                  >
                    {isSaving
                      ? "Saving..."
                      : selectedTemplateId === "new"
                        ? "Save Template"
                        : "Update Template"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowTemplatesModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Your Saved Templates
              </h3>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No saved templates yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Save your current allocation to create a template
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => {
                    const isExpanded = expandedTemplateId === template.id;
                    return (
                      <div
                        key={template.id}
                        className="rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
                      >
                        {/* Header with icon and name */}
                        <div className="p-4 pb-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 flex-shrink-0">
                              <Layers className="h-5 w-5 text-emerald-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {editingTemplateId === template.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingTemplateName}
                                    onChange={(e) => setEditingTemplateName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveRename();
                                      if (e.key === "Escape") handleCancelRename();
                                    }}
                                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                    disabled={isRenaming}
                                  />
                                  <button
                                    onClick={handleSaveRename}
                                    disabled={isRenaming || !editingTemplateName.trim()}
                                    className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                    title="Save"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelRename}
                                    disabled={isRenaming}
                                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-medium text-slate-900">{template.name}</h4>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => handleStartRename(template)}
                                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                      title="Rename template"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTemplate(template.id)}
                                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                      title="Delete template"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              {template.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Amount & Frequency badges */}
                          {(template.amountCents || template.frequency) && (
                            <div className="flex flex-wrap gap-2 mt-3 ml-[52px]">
                              {template.amountCents && (
                                <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatCurrency(template.amountCents)}
                                </Badge>
                              )}
                              {template.frequency && (
                                <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  {template.frequency === "one-time" ? "One-time" : template.frequency}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Collapsible Allocation Section */}
                          <div className="mt-3 ml-[52px]">
                            <button
                              onClick={() => setExpandedTemplateId(isExpanded ? null : template.id)}
                              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                              <span>
                                {template.items.length} allocation{template.items.length !== 1 ? "s" : ""}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 space-y-2">
                                {template.items.map((item, index) => (
                                  <div key={`${template.id}-${item.targetId}-${index}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {item.type === "nonprofit" ? (
                                        <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                      ) : (
                                        <Tag className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                      )}
                                      <span className="text-sm text-slate-600 truncate">
                                        {item.targetName}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-900 flex-shrink-0">
                                      {item.percentage}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Progress Bar - always visible */}
                            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
                              {template.items.map((item, index) => (
                                <div
                                  key={`bar-${template.id}-${item.targetId}-${index}`}
                                  className={allocationColors[index % allocationColors.length]}
                                  style={{ width: `${item.percentage}%` }}
                                />
                              ))}
                            </div>

                            <p className="text-xs text-slate-400 mt-2">
                              Last updated {formatDate(template.updatedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="px-4 pb-4 flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleLoadTemplate(template)}
                          >
                            <Heart className="mr-2 h-4 w-4" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowTemplatesModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
