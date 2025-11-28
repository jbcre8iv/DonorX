"use client";

import { useState, useTransition } from "react";
import { ExternalLink, CheckCircle, XCircle, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { approveNonprofit, rejectNonprofit, deleteNonprofit } from "./actions";
import type { SortField, SortDirection } from "./nonprofits-client";

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
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export function NonprofitTable({ nonprofits, onEdit, sortField, sortDirection, onSort }: NonprofitTableProps) {
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />;
    }
    return sortDirection === "asc"
      ? <ArrowUp className="ml-1 h-3 w-3 text-blue-600" />
      : <ArrowDown className="ml-1 h-3 w-3 text-blue-600" />;
  };

  const SortableHeader = ({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th className={`pb-3 font-medium ${className}`}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        {children}
        <SortIcon field={field} />
      </button>
    </th>
  );

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
            <SortableHeader field="name">Organization</SortableHeader>
            <SortableHeader field="ein">EIN</SortableHeader>
            <SortableHeader field="category">Category</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <th className="pb-3 font-medium text-right">
              <button
                onClick={() => onSort("total_received")}
                className="flex items-center ml-auto hover:text-blue-600 transition-colors"
              >
                Total Received
                <SortIcon field="total_received" />
              </button>
            </th>
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
