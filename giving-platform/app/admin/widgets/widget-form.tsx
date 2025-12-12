"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createWidget } from "./actions";
import type { Nonprofit } from "@/types/database";

interface WidgetFormProps {
  nonprofits: Nonprofit[];
}

export function WidgetForm({ nonprofits }: WidgetFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: "",
    nonprofit_id: "",
    primary_color: "#059669",
    button_text: "Donate Now",
    show_cover_fees: true,
    show_anonymous: true,
    show_dedications: false,
    allow_custom_amount: true,
    min_amount_cents: 500,
    preset_amounts: "25,50,100,250",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Parse preset amounts
      const presetAmounts = formData.preset_amounts
        .split(",")
        .map((s) => parseInt(s.trim()) * 100)
        .filter((n) => !isNaN(n) && n > 0);

      const result = await createWidget({
        name: formData.name,
        nonprofit_id: formData.nonprofit_id,
        primary_color: formData.primary_color,
        button_text: formData.button_text,
        show_cover_fees: formData.show_cover_fees,
        show_anonymous: formData.show_anonymous,
        show_dedications: formData.show_dedications,
        allow_custom_amount: formData.allow_custom_amount,
        min_amount_cents: formData.min_amount_cents,
        preset_amounts: presetAmounts,
      });

      if (!result.success) {
        setError(result.error || "Failed to create widget");
        return;
      }

      router.push(`/admin/widgets/${result.widgetId}`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <Input
        label="Widget Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g., Homepage Widget"
        required
        helperText="Internal name to identify this widget"
      />

      {/* Nonprofit */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-900">
          Nonprofit
        </label>
        <select
          name="nonprofit_id"
          value={formData.nonprofit_id}
          onChange={handleChange}
          required
          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
        >
          <option value="">Select a nonprofit</option>
          {nonprofits.map((np) => (
            <option key={np.id} value={np.id}>
              {np.name}
            </option>
          ))}
        </select>
      </div>

      {/* Customization */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900">
            Primary Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              name="primary_color"
              value={formData.primary_color}
              onChange={handleChange}
              className="h-10 w-14 rounded border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={formData.primary_color}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, primary_color: e.target.value }))
              }
              className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-sm"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>

        <Input
          label="Button Text"
          name="button_text"
          value={formData.button_text}
          onChange={handleChange}
          placeholder="Donate Now"
        />
      </div>

      {/* Preset Amounts */}
      <Input
        label="Preset Amounts (in dollars)"
        name="preset_amounts"
        value={formData.preset_amounts}
        onChange={handleChange}
        placeholder="25, 50, 100, 250"
        helperText="Comma-separated dollar amounts"
      />

      {/* Min Amount */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-900">
          Minimum Donation
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input
            type="number"
            name="min_amount_cents"
            value={formData.min_amount_cents / 100}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                min_amount_cents: parseFloat(e.target.value) * 100,
              }))
            }
            min="1"
            step="0.01"
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-900">
          Widget Options
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="allow_custom_amount"
            checked={formData.allow_custom_amount}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">Allow custom amount entry</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="show_cover_fees"
            checked={formData.show_cover_fees}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">Show &quot;cover fees&quot; option</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="show_anonymous"
            checked={formData.show_anonymous}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">Show anonymous donation option</span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Widget
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
