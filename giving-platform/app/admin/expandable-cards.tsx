"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, CreditCard, Clock, User, Building2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PendingApprovalButtons } from "./pending-approval-buttons";

interface DonationWithDetails {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string;
  is_simulated?: boolean;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | { first_name: string | null; last_name: string | null; email: string }[] | null;
  allocations?: {
    amount_cents: number;
    percentage: number;
    nonprofit?: { name: string } | { name: string }[] | null;
    category?: { name: string } | { name: string }[] | null;
  }[];
}

interface PendingNonprofit {
  id: string;
  name: string;
  ein: string | null;
  category_id: string | null;
  created_at: string;
  description?: string | null;
  website?: string | null;
  mission?: string | null;
}

interface ExpandableRecentDonationsProps {
  donations: DonationWithDetails[];
}

interface Category {
  id: string;
  name: string;
}

interface ExpandablePendingApprovalsProps {
  nonprofits: PendingNonprofit[];
  categories: Category[];
}

export function ExpandableRecentDonations({ donations }: ExpandableRecentDonationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Donations</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/donations">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {donations.length === 0 ? (
          <p className="text-center text-slate-500 py-4">No donations yet</p>
        ) : (
          <div className="space-y-2">
            {donations.map((donation) => {
              const isExpanded = expandedId === donation.id;
              // Handle both array and object cases from Supabase
              const user = Array.isArray(donation.user) ? donation.user[0] : donation.user;
              const donorName = user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email || "Anonymous";

              return (
                <div
                  key={donation.id}
                  className="rounded-lg border border-slate-200 overflow-hidden transition-all"
                >
                  {/* Collapsed Header */}
                  <button
                    onClick={() => toggleExpand(donation.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 flex-shrink-0">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(donation.amount_cents)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(donation.created_at)}
                      </p>
                    </div>
                    <Badge variant="success">Completed</Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50">
                      <div className="space-y-3">
                        {/* Donor Info */}
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">Donor:</span>
                          <span className="font-medium text-slate-900">{donorName}</span>
                        </div>

                        {/* Simulated Badge */}
                        {donation.is_simulated && (
                          <Badge variant="warning" className="text-xs">Simulated</Badge>
                        )}

                        {/* Allocations */}
                        {donation.allocations && donation.allocations.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                              Allocations
                            </p>
                            <div className="space-y-1">
                              {donation.allocations.map((alloc, idx) => {
                                // Handle both array and object cases from Supabase
                                const nonprofit = Array.isArray(alloc.nonprofit) ? alloc.nonprofit[0] : alloc.nonprofit;
                                const category = Array.isArray(alloc.category) ? alloc.category[0] : alloc.category;
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-sm bg-white rounded px-2 py-1"
                                  >
                                    <span className="text-slate-700">
                                      {nonprofit?.name || category?.name || "Unknown"}
                                    </span>
                                    <span className="text-slate-900 font-medium">
                                      {formatCurrency(alloc.amount_cents)} ({alloc.percentage}%)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* View Details Link */}
                        <Button variant="outline" size="sm" asChild className="w-full mt-2">
                          <Link href={`/admin/donations?id=${donation.id}`}>
                            View Full Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExpandablePendingApprovals({
  nonprofits,
  categories
}: ExpandablePendingApprovalsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pending Approvals</CardTitle>
        {nonprofits.length > 0 && (
          <Badge variant="warning">{nonprofits.length} pending</Badge>
        )}
      </CardHeader>
      <CardContent>
        {nonprofits.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-slate-500">All caught up!</p>
            <p className="text-sm text-slate-400">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-2">
            {nonprofits.slice(0, 5).map((nonprofit) => {
              const isExpanded = expandedId === nonprofit.id;

              return (
                <div
                  key={nonprofit.id}
                  className="rounded-lg border border-slate-200 overflow-hidden transition-all"
                >
                  {/* Collapsed Header */}
                  <button
                    onClick={() => toggleExpand(nonprofit.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 flex-shrink-0">
                      <Building2 className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-slate-900">{nonprofit.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {nonprofit.ein && <span>EIN: {nonprofit.ein}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(nonprofit.created_at)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      {getCategoryName(nonprofit.category_id)}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50">
                      <div className="space-y-3">
                        {/* Category (shown on mobile) */}
                        <div className="sm:hidden">
                          <Badge variant="secondary">
                            {getCategoryName(nonprofit.category_id)}
                          </Badge>
                        </div>

                        {/* Mission */}
                        {nonprofit.mission && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                              Mission
                            </p>
                            <p className="text-sm text-slate-700 line-clamp-3">
                              {nonprofit.mission}
                            </p>
                          </div>
                        )}

                        {/* Description */}
                        {nonprofit.description && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                              Description
                            </p>
                            <p className="text-sm text-slate-700 line-clamp-3">
                              {nonprofit.description}
                            </p>
                          </div>
                        )}

                        {/* Website */}
                        {nonprofit.website && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                              Website
                            </p>
                            <a
                              href={nonprofit.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {nonprofit.website}
                            </a>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <PendingApprovalButtons nonprofitId={nonprofit.id} />
                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link href={`/admin/nonprofits/${nonprofit.id}`}>
                              View Full Profile
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {nonprofits.length > 5 && (
              <Button variant="outline" fullWidth asChild className="mt-2">
                <Link href="/admin/nonprofits?status=pending">
                  View all {nonprofits.length} pending
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
