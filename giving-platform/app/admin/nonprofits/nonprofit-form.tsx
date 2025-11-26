"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createNonprofit, updateNonprofit } from "./actions";

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name *
              </label>
              <Input
                name="name"
                defaultValue={nonprofit?.name || ""}
                placeholder="Organization name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                EIN *
              </label>
              <Input
                name="ein"
                defaultValue={nonprofit?.ein || ""}
                placeholder="XX-XXXXXXX"
                required
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
              defaultValue={nonprofit?.category_id || ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Website
            </label>
            <Input
              name="website"
              type="url"
              defaultValue={nonprofit?.website || ""}
              placeholder="https://example.org"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Logo URL
            </label>
            <Input
              name="logo_url"
              type="url"
              defaultValue={nonprofit?.logo_url || ""}
              placeholder="https://example.org/logo.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Short Description
            </label>
            <Input
              name="description"
              defaultValue={nonprofit?.description || ""}
              placeholder="Brief description of the organization"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mission Statement
            </label>
            <textarea
              name="mission"
              defaultValue={nonprofit?.mission || ""}
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
