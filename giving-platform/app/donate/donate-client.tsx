"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, AlertCircle, RefreshCw, Save, FolderOpen, Trash2, X } from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AmountInput } from "@/components/donation/amount-input";
import { AllocationBuilder, type AllocationItem } from "@/components/donation/allocation-builder";
import { FrequencySelector, type DonationFrequency } from "@/components/donation/frequency-selector";
import { type Allocation as AIAllocation } from "@/components/ai/allocation-advisor";
import { formatCurrency } from "@/lib/utils";
import { createCheckoutSession, saveTemplate, updateTemplate, loadTemplates, deleteTemplate, clearDraft, type AllocationInput, type DonationTemplate, type TemplateItem, type SaveTemplateResult } from "./actions";
import { useCartFavorites, type DraftAllocation, type DonationDraft } from "@/contexts/cart-favorites-context";
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
}

export function DonateClient({
  nonprofits,
  categories,
  preselectedNonprofitId,
}: DonateClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const canceled = searchParams.get("canceled") === "true";

  const { donationDraft, saveDonationDraft, clearDonationDraft } = useCartFavorites();
  const [draftLoaded, setDraftLoaded] = React.useState(false);
  // Track if allocations were loaded from a draft (vs preselected nonprofit or cart)
  const [loadedFromDraft, setLoadedFromDraft] = React.useState(false);
  // Track previous draft state to detect when it's cleared from another device
  const prevDraftRef = React.useRef<DonationDraft | null | undefined>(undefined);

  const [amount, setAmount] = React.useState(100000); // Start with first preset of middle range
  const [frequency, setFrequency] = React.useState<DonationFrequency>("one-time");
  const [allocations, setAllocations] = React.useState<AllocationItem[]>([]);

  // Initialize allocations from preselected nonprofit, cart, or draft
  React.useEffect(() => {
    // Only run once on mount
    if (draftLoaded) return;

    const fromCart = searchParams.get("from") === "cart";

    // If coming from cart, load items from sessionStorage (highest priority)
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

    // Check for preselected nonprofit (second priority)
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

    // Otherwise, restore from draft if available
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
  }, [preselectedNonprofitId, nonprofits, searchParams, donationDraft, draftLoaded]);

  // Handle when draft is cleared from another device (via realtime sync)
  // Redirect to directory so user knows the donation was cancelled
  React.useEffect(() => {
    // Skip on initial render (prevDraftRef is undefined)
    if (prevDraftRef.current === undefined) {
      prevDraftRef.current = donationDraft;
      return;
    }

    // Detect transition from having a draft to no draft
    const hadDraft = prevDraftRef.current !== null;
    const nowHasNoDraft = donationDraft === null;

    // Update the ref for next comparison
    prevDraftRef.current = donationDraft;

    // If we had a draft and now we don't, and we have allocations displayed,
    // the draft was cleared (either from this device's sidebar or another device)
    if (draftLoaded && hadDraft && nowHasNoDraft && allocations.length > 0) {
      // Redirect to directory - the donation was cancelled
      router.push("/directory");
    }
  }, [donationDraft, draftLoaded, allocations.length, router]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  // Auto-save draft when donation state changes
  React.useEffect(() => {
    // Don't save until initial load is complete
    if (!draftLoaded) return;

    // Save draft with current state (even if no allocations yet)
    // This preserves amount/frequency if user navigates away
    const draft: DonationDraft = {
      amountCents: amount * 100,
      frequency,
      allocations: allocations.map((a) => ({
        type: a.type,
        targetId: a.targetId,
        targetName: a.targetName,
        percentage: a.percentage,
      })),
    };
    saveDonationDraft(draft);
  }, [amount, frequency, allocations, draftLoaded, saveDonationDraft]);

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
        // Clear the draft since user is proceeding to payment
        await clearDonationDraft();
        // Redirect to Stripe Checkout
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
                onClick={() => setShowSaveModal(true)}
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
                    {isRecurring ? (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    {isLoading
                      ? "Processing..."
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Save to
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="new">Create new template</option>
                    <optgroup label="Overwrite existing">
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900">
                            {template.name}
                          </h4>
                          {template.description && (
                            <p className="text-sm text-slate-500 mt-1">
                              {template.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {template.items.length} item{template.items.length !== 1 ? "s" : ""}
                            </span>
                            {template.amountCents && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                {formatCurrency(template.amountCents)}
                              </span>
                            )}
                            {template.frequency && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded capitalize">
                                {template.frequency === "one-time" ? "One-time" : template.frequency}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleLoadTemplate(template)}
                          >
                            Load
                          </Button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Delete template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
