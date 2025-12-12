"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ExternalLink, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateNonprofitProfile, type ProfileFormData } from "../actions";
import type { Nonprofit } from "@/types/database";

interface ProfileFormProps {
  nonprofit: Nonprofit;
  canEdit: boolean;
}

export function ProfileForm({ nonprofit, canEdit }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [formData, setFormData] = React.useState<ProfileFormData>({
    name: nonprofit.name,
    mission: nonprofit.mission || "",
    description: nonprofit.description || "",
    website: nonprofit.website || "",
    logo_url: nonprofit.logo_url || "",
    contact_name: nonprofit.contact_name || "",
    contact_email: nonprofit.contact_email || "",
    phone: nonprofit.phone || "",
    address_line1: nonprofit.address_line1 || "",
    address_line2: nonprofit.address_line2 || "",
    city: nonprofit.city || "",
    state: nonprofit.state || "",
    postal_code: nonprofit.postal_code || "",
    country: nonprofit.country || "US",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateNonprofitProfile(nonprofit.id, formData);

      if (!result.success) {
        setError(result.error || "Failed to update profile");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            This information appears on your public profile page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Organization Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!canEdit}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="EIN"
              value={nonprofit.ein || "Not provided"}
              disabled
              helperText="Contact support to update your EIN"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                Status
              </label>
              <div className="flex items-center gap-2 h-10">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                    nonprofit.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : nonprofit.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {nonprofit.status === "approved" && (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {nonprofit.status.charAt(0).toUpperCase() + nonprofit.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Mission Statement
            </label>
            <textarea
              name="mission"
              value={formData.mission || ""}
              onChange={handleChange}
              disabled={!canEdit}
              rows={3}
              placeholder="Describe your organization's mission..."
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              About / Description
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              disabled={!canEdit}
              rows={4}
              placeholder="Tell donors more about what you do..."
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Website"
              name="website"
              type="url"
              value={formData.website || ""}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="https://yourorganization.org"
            />
            <Input
              label="Logo URL"
              name="logo_url"
              type="url"
              value={formData.logo_url || ""}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="https://example.com/logo.png"
              helperText="Use a square image for best results"
            />
          </div>

          {nonprofit.logo_url && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <img
                src={nonprofit.logo_url}
                alt="Current logo"
                className="h-16 w-16 rounded-lg object-contain border border-slate-200 bg-white"
              />
              <div>
                <p className="text-sm font-medium text-slate-700">Current Logo</p>
                <a
                  href={nonprofit.logo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  View full size <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Primary contact for your organization. This is not displayed publicly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contact Name"
              name="contact_name"
              value={formData.contact_name || ""}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="Jane Doe"
            />
            <Input
              label="Contact Email"
              name="contact_email"
              type="email"
              value={formData.contact_email || ""}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="contact@organization.org"
            />
          </div>
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone || ""}
            onChange={handleChange}
            disabled={!canEdit}
            placeholder="(555) 123-4567"
          />
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>
            Your organization&apos;s physical address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Address Line 1"
            name="address_line1"
            value={formData.address_line1 || ""}
            onChange={handleChange}
            disabled={!canEdit}
            placeholder="123 Main Street"
          />
          <Input
            label="Address Line 2"
            name="address_line2"
            value={formData.address_line2 || ""}
            onChange={handleChange}
            disabled={!canEdit}
            placeholder="Suite 100 (optional)"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="City"
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="San Francisco"
            />
            <Input
              label="State/Province"
              name="state"
              value={formData.state || ""}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="CA"
            />
            <Input
              label="Postal Code"
              name="postal_code"
              value={formData.postal_code || ""}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="94102"
            />
          </div>
          <Input
            label="Country"
            name="country"
            value={formData.country || "US"}
            onChange={handleChange}
            disabled={!canEdit}
            placeholder="US"
            helperText="Two-letter country code (e.g., US, CA, UK)"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center justify-between">
          <div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Profile updated successfully
              </p>
            )}
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
