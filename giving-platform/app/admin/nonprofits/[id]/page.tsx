import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, ExternalLink, Globe, Mail, Phone, MapPin } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { UserManagement } from "./user-management";

export const metadata = {
  title: "Nonprofit Details",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NonprofitDetailPage({ params }: PageProps) {
  const { id } = await params;
  const adminClient = createAdminClient();

  // Fetch nonprofit details
  const { data: nonprofit, error } = await adminClient
    .from("nonprofits")
    .select(`
      *,
      category:categories(id, name)
    `)
    .eq("id", id)
    .single();

  if (error || !nonprofit) {
    notFound();
  }

  // Fetch users linked to this nonprofit
  const { data: nonprofitUsers } = await adminClient
    .from("nonprofit_users")
    .select(`
      id,
      user_id,
      role,
      created_at,
      user:users(id, email, full_name)
    `)
    .eq("nonprofit_id", id)
    .order("created_at", { ascending: true });

  // Fetch donation stats
  const { data: allocations } = await adminClient
    .from("allocations")
    .select(`
      amount_cents,
      donation:donations!inner(status)
    `)
    .eq("nonprofit_id", id)
    .eq("donation.status", "completed");

  const totalReceived = (allocations || []).reduce(
    (sum, a: { amount_cents: number }) => sum + a.amount_cents,
    0
  );

  // Format users for the client component
  const users = (nonprofitUsers || []).map((nu) => {
    const user = Array.isArray(nu.user) ? nu.user[0] : nu.user;
    return {
      id: nu.id,
      userId: nu.user_id,
      email: (user as { email?: string })?.email || "Unknown",
      fullName: (user as { full_name?: string })?.full_name || null,
      role: nu.role as "admin" | "editor" | "viewer",
      createdAt: nu.created_at,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/nonprofits">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Nonprofits
          </Button>
        </Link>
      </div>

      {/* Nonprofit Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            {nonprofit.logo_url ? (
              <img
                src={nonprofit.logo_url}
                alt={nonprofit.name}
                className="h-16 w-16 rounded-lg object-contain border border-slate-200"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{nonprofit.name}</CardTitle>
                <Badge
                  variant={
                    nonprofit.status === "approved"
                      ? "success"
                      : nonprofit.status === "pending"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {nonprofit.status}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {nonprofit.ein ? `EIN: ${nonprofit.ein}` : "No EIN"}
                {nonprofit.category && (
                  <span className="ml-2">
                    | Category: {(nonprofit.category as { name: string }).name}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Received</p>
              <p className="text-xl font-semibold text-emerald-600">
                {formatCurrency(totalReceived)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900">Contact Information</h4>
              {nonprofit.contact_email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${nonprofit.contact_email}`} className="hover:text-emerald-600">
                    {nonprofit.contact_email}
                  </a>
                </div>
              )}
              {nonprofit.contact_name && (
                <p className="text-sm text-slate-600 ml-6">{nonprofit.contact_name}</p>
              )}
              {nonprofit.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="h-4 w-4" />
                  {nonprofit.phone}
                </div>
              )}
              {nonprofit.website && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Globe className="h-4 w-4" />
                  <a
                    href={nonprofit.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-600 flex items-center gap-1"
                  >
                    {nonprofit.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {(nonprofit.city || nonprofit.state) && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {[nonprofit.city, nonprofit.state].filter(Boolean).join(", ")}
                </div>
              )}
            </div>

            {/* Description/Mission */}
            <div className="space-y-3">
              {nonprofit.mission && (
                <div>
                  <h4 className="font-medium text-slate-900">Mission</h4>
                  <p className="text-sm text-slate-600 mt-1">{nonprofit.mission}</p>
                </div>
              )}
              {nonprofit.description && (
                <div>
                  <h4 className="font-medium text-slate-900">Description</h4>
                  <p className="text-sm text-slate-600 mt-1">{nonprofit.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/directory/${nonprofit.id}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <UserManagement
        nonprofitId={id}
        nonprofitName={nonprofit.name}
        users={users}
      />
    </div>
  );
}
