"use client";

import { useState, useTransition } from "react";
import { ExternalLink, CheckCircle, XCircle, Star, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { approveNonprofit, rejectNonprofit, toggleFeatured, deleteNonprofit } from "./actions";

interface Nonprofit {
  id: string;
  name: string;
  ein: string | null;
  description: string | null;
  mission: string | null;
  website: string | null;
  logo_url: string | null;
  status: string;
  is_featured: boolean;
  category_id: string | null;
  category: { id: string; name: string } | null;
  total_received: number;
}

interface NonprofitTableProps {
  nonprofits: Nonprofit[];
  onEdit: (nonprofit: Nonprofit) => void;
}

export function NonprofitTable({ nonprofits, onEdit }: NonprofitTableProps) {
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setActionId(id);
    startTransition(async () => {
      await approveNonprofit(id);
      setActionId(null);
    });
  };

  const handleReject = (id: string) => {
    setActionId(id);
    startTransition(async () => {
      await rejectNonprofit(id);
      setActionId(null);
    });
  };

  const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
    setActionId(id);
    startTransition(async () => {
      await toggleFeatured(id, !currentFeatured);
      setActionId(null);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this nonprofit?")) return;
    setActionId(id);
    startTransition(async () => {
      const result = await deleteNonprofit(id);
      if (result.error) {
        alert(result.error);
      }
      setActionId(null);
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
            <th className="pb-3 font-medium">Organization</th>
            <th className="pb-3 font-medium">EIN</th>
            <th className="pb-3 font-medium">Category</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium text-right">Total Received</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {nonprofits.map((nonprofit) => (
            <tr key={nonprofit.id} className="text-sm">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  {nonprofit.logo_url ? (
                    <img
                      src={nonprofit.logo_url}
                      alt={nonprofit.name}
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold">
                      {nonprofit.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {nonprofit.name}
                      </p>
                      {nonprofit.is_featured && (
                        <Badge variant="success" className="text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>
                    {nonprofit.website && (
                      <a
                        href={nonprofit.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-4">
                {nonprofit.ein ? (
                  <span className="text-slate-600">{nonprofit.ein}</span>
                ) : (
                  <Badge variant="warning" className="text-xs">
                    Missing EIN
                  </Badge>
                )}
              </td>
              <td className="py-4">
                <Badge variant="secondary">
                  {nonprofit.category?.name || "Uncategorized"}
                </Badge>
              </td>
              <td className="py-4">
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
              </td>
              <td className="py-4 text-right font-medium text-slate-900">
                {formatCurrency(nonprofit.total_received)}
              </td>
              <td className="py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {nonprofit.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50"
                        onClick={() => handleApprove(nonprofit.id)}
                        disabled={isPending && actionId === nonprofit.id}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(nonprofit.id)}
                        disabled={isPending && actionId === nonprofit.id}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {nonprofit.status === "approved" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        nonprofit.is_featured
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-slate-400 hover:bg-slate-50"
                      }
                      onClick={() =>
                        handleToggleFeatured(nonprofit.id, nonprofit.is_featured)
                      }
                      disabled={isPending && actionId === nonprofit.id}
                      title={nonprofit.is_featured ? "Remove from featured" : "Add to featured"}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          nonprofit.is_featured ? "fill-current" : ""
                        }`}
                      />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => onEdit(nonprofit)}
                    disabled={isPending && actionId === nonprofit.id}
                    title="Edit nonprofit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(nonprofit.id)}
                    disabled={isPending && actionId === nonprofit.id}
                    title="Delete nonprofit"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
