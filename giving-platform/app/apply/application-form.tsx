"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckCircle, Building2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { submitApplication, extractNonprofitInfo, checkNonprofitExists } from "./actions";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface ApplicationFormProps {
  categories: Category[];
}

export function ApplicationForm({ categories }: ApplicationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isExtracting, setIsExtracting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingNonprofit, setExistingNonprofit] = useState<{
    id: string;
    name: string;
    status: string;
  } | null>(null);

  // Form state
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [ein, setEin] = useState("");
  const [description, setDescription] = useState("");
  const [mission, setMission] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const handleQuickFill = async () => {
    if (!website) {
      setError("Please enter your website URL first");
      return;
    }

    setError(null);
    setIsExtracting(true);

    try {
      // Ensure URL has protocol
      let url = website;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
        setWebsite(url);
      }

      const info = await extractNonprofitInfo(url);

      if (info.error) {
        setError(info.error);
        return;
      }

      // Fill in the form fields
      if (info.name) setName(info.name);
      if (info.logoUrl) setLogoUrl(info.logoUrl);
      if (info.description) setDescription(info.description);
      if (info.mission) setMission(info.mission);

      // Match category by name
      if (info.suggestedCategory) {
        const matchedCategory = categories.find(
          (c) => c.name.toLowerCase() === info.suggestedCategory?.toLowerCase()
        );
        if (matchedCategory) {
          setCategoryId(matchedCategory.id);
        }
      }

      // Check if nonprofit already exists
      const existsCheck = await checkNonprofitExists(info.name, undefined, url);
      if (existsCheck.exists && existsCheck.nonprofit) {
        setExistingNonprofit(existsCheck.nonprofit);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract info");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitApplication({
        name,
        ein: ein || undefined,
        website: website || undefined,
        description: description || undefined,
        mission: mission || undefined,
        category_id: categoryId || undefined,
        logo_url: logoUrl || undefined,
        contact_name: contactName,
        contact_email: contactEmail,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          Application Submitted!
        </h2>
        <p className="mt-2 text-slate-600">
          Thank you for applying to join our directory. We&apos;ll review your
          application and get back to you soon.
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => router.push("/directory")}
        >
          Browse Directory
        </Button>
      </div>
    );
  }

  // Show special UI when nonprofit already exists
  if (existingNonprofit) {
    const isPending = existingNonprofit.status === "pending";
    const isApproved = existingNonprofit.status === "approved";

    return (
      <div className="text-center py-8">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
          isApproved ? "bg-emerald-100" : isPending ? "bg-amber-100" : "bg-blue-100"
        }`}>
          {isApproved ? (
            <Building2 className="h-8 w-8 text-emerald-600" />
          ) : isPending ? (
            <Clock className="h-8 w-8 text-amber-600" />
          ) : (
            <AlertCircle className="h-8 w-8 text-blue-600" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          {isApproved
            ? "Already in Our Directory!"
            : isPending
            ? "Application Pending"
            : "Organization Found"}
        </h2>
        <p className="mt-2 text-slate-600 max-w-md mx-auto">
          {isApproved ? (
            <>
              <strong>{existingNonprofit.name}</strong> is already listed in our
              directory. You can view their profile and donate directly.
            </>
          ) : isPending ? (
            <>
              <strong>{existingNonprofit.name}</strong> already has a pending
              application. We&apos;re reviewing it and will notify you once it&apos;s approved.
            </>
          ) : (
            <>
              <strong>{existingNonprofit.name}</strong> is already in our system.
              Please contact us if you need to update your listing.
            </>
          )}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {isApproved && (
            <Button asChild>
              <Link href={`/directory/${existingNonprofit.id}`}>
                View Profile
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/directory")}
          >
            Browse Directory
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setExistingNonprofit(null);
              setName("");
              setWebsite("");
            }}
          >
            Apply for Different Organization
          </Button>
        </div>
      </div>
    );
  }

  const categoryOptions = [
    { value: "", label: "Select a category" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Quick Fill Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="flex items-center gap-2 font-medium text-blue-900">
          <Sparkles className="h-4 w-4" />
          Quick Fill from Website
        </h3>
        <p className="mt-1 text-sm text-blue-700">
          Enter your website URL and we&apos;ll automatically fill in your organization details.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="https://yournonprofit.org"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleQuickFill}
            disabled={isExtracting}
            className="shrink-0"
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Quick Fill
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Contact Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Your Name <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="John Doe"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              required
              placeholder="john@nonprofit.org"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Organization Details */}
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Organization Details</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <Input
            required
            placeholder="Your Nonprofit Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              EIN (Tax ID)
            </label>
            <Input
              placeholder="XX-XXXXXXX"
              value={ein}
              onChange={(e) => setEin(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional - can be added later
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Category
            </label>
            <Select
              options={categoryOptions}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Website
          </label>
          <Input
            placeholder="https://yournonprofit.org"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Logo URL
          </label>
          <Input
            placeholder="https://yournonprofit.org/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          {logoUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-10 w-10 rounded object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="text-xs text-slate-500">Preview</span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Short Description
          </label>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
            placeholder="A brief description of your organization (1-2 sentences)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Mission Statement
          </label>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="What is your organization's mission?"
            value={mission}
            onChange={(e) => setMission(e.target.value)}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Application"
        )}
      </Button>
    </form>
  );
}
