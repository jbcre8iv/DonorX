"use client";

import { useState, useTransition, useRef } from "react";
import { X, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createNonprofit, updateNonprofit, detectLogoUrl, extractNonprofitInfo } from "./actions";

interface Category {
  id: string;
  name: string;
}

interface Nonprofit {
  id: string;
  name: string;
  ein: string | null;
  description: string | null;
  mission: string | null;
  website: string | null;
  logo_url: string | null;
  category_id: string | null;
}

interface NonprofitFormProps {
  nonprofit?: Nonprofit | null;
  categories: Category[];
  onClose: () => void;
}

export function NonprofitForm({ nonprofit, categories, onClose }: NonprofitFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(nonprofit?.logo_url || "");
  const [isDetectingLogo, setIsDetectingLogo] = useState(false);
  const [isExtractingInfo, setIsExtractingInfo] = useState(false);
  const [logoLoadState, setLogoLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [quickFillUrl, setQuickFillUrl] = useState("");
  const websiteInputRef = useRef<HTMLInputElement>(null);

  // Controlled form state for Quick Fill
  const [formData, setFormData] = useState({
    name: nonprofit?.name || "",
    website: nonprofit?.website || "",
    description: nonprofit?.description || "",
    mission: nonprofit?.mission || "",
    categoryId: nonprofit?.category_id || "",
  });

  const handleQuickFill = async () => {
    if (!quickFillUrl) {
      setError("Please enter a website URL");
      return;
    }

    setIsExtractingInfo(true);
    setError(null);

    try {
      const result = await extractNonprofitInfo(quickFillUrl);

      if (result.error) {
        setError(result.error);
      } else {
        // Update all form fields with extracted data
        setFormData((prev) => ({
          name: result.name || prev.name,
          website: quickFillUrl,
          description: result.description || prev.description,
          mission: result.mission || prev.mission,
          categoryId: prev.categoryId, // Keep existing or find matching category
        }));

        if (result.logoUrl) {
          setLogoUrl(result.logoUrl);
          setLogoLoadState("loading");
        }

        // Try to match suggested category
        if (result.suggestedCategory) {
          const suggested = result.suggestedCategory.toLowerCase().trim();
          // First try exact match
          let matchedCategory = categories.find(
            (c) => c.name.toLowerCase().trim() === suggested
          );
          // Then try partial matching
          if (!matchedCategory) {
            matchedCategory = categories.find(
              (c) => c.name.toLowerCase().includes(suggested) ||
                     suggested.includes(c.name.toLowerCase())
            );
          }
          if (matchedCategory) {
            setFormData((prev) => ({ ...prev, categoryId: matchedCategory.id }));
          } else {
            console.log("Category not matched:", result.suggestedCategory, "Available:", categories.map(c => c.name));
          }
        }
      }
    } catch (err) {
      setError("Failed to extract nonprofit information");
    } finally {
      setIsExtractingInfo(false);
    }
  };

  const handleDetectLogo = async () => {
    const websiteUrl = websiteInputRef.current?.value;
    if (!websiteUrl) {
      setError("Please enter a website URL first");
      return;
    }

    setIsDetectingLogo(true);
    setError(null);

    try {
      const result = await detectLogoUrl(websiteUrl);
      if (result.error) {
        setError(result.error);
      } else if (result.logoUrl) {
        setLogoUrl(result.logoUrl);
        setLogoLoadState("loading");
      }
    } catch (err) {
      setError("Failed to detect logo");
    } finally {
      setIsDetectingLogo(false);
    }
  };

  const categoryOptions = [
    { value: "", label: "Select a category" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = nonprofit
        ? await updateNonprofit(nonprofit.id, formData)
        : await createNonprofit(formData);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {nonprofit ? "Edit Nonprofit" : "Add Nonprofit"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Quick Fill Section - only show for new nonprofits */}
        {!nonprofit && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <label className="block text-sm font-medium text-emerald-800 mb-2">
              Quick Fill from Website
            </label>
            <p className="text-xs text-emerald-600 mb-3">
              Paste the nonprofit&apos;s website URL and let AI fill in the details
            </p>
            <div className="flex gap-2">
              <Input
                type="url"
                value={quickFillUrl}
                onChange={(e) => setQuickFillUrl(e.target.value)}
                placeholder="https://nonprofit-website.org"
                className="flex-1 bg-white"
              />
              <Button
                type="button"
                onClick={handleQuickFill}
                disabled={isExtractingInfo}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isExtractingInfo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Fill Form
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Organization name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                EIN <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <Input
                name="ein"
                defaultValue={nonprofit?.ein || ""}
                placeholder="XX-XXXXXXX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <Select
              name="category_id"
              options={categoryOptions}
              value={formData.categoryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Website
            </label>
            <Input
              ref={websiteInputRef}
              name="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="https://example.org"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Logo URL
            </label>
            <div className="flex gap-2">
              <Input
                name="logo_url"
                type="url"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setLogoLoadState("loading");
                }}
                placeholder="https://example.org/logo.png"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleDetectLogo}
                disabled={isDetectingLogo}
                title="Auto-detect logo from website"
              >
                {isDetectingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
            {logoUrl && (
              <div className="mt-2 flex items-center gap-2">
                {logoLoadState === "loading" && (
                  <div className="h-8 w-8 rounded border bg-slate-100 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                )}
                {logoLoadState === "error" && (
                  <div className="h-8 w-8 rounded border border-red-200 bg-red-50 flex items-center justify-center" title="Failed to load image">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  </div>
                )}
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className={`h-8 w-8 rounded object-contain border ${logoLoadState !== "loaded" ? "hidden" : ""}`}
                  onLoad={() => setLogoLoadState("loaded")}
                  onError={() => setLogoLoadState("error")}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">
                    {logoUrl}
                  </span>
                  {logoLoadState === "error" && (
                    <span className="text-xs text-red-500">
                      Image failed to load (CORS or invalid URL)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Short Description
            </label>
            <Input
              name="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the organization"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mission Statement
            </label>
            <textarea
              name="mission"
              value={formData.mission}
              onChange={(e) => setFormData((prev) => ({ ...prev, mission: e.target.value }))}
              placeholder="The organization's mission..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending
                ? "Saving..."
                : nonprofit
                ? "Save Changes"
                : "Add Nonprofit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
