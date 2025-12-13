"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, CheckCircle, XCircle, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, TestTube, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
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

// Sort icon component - defined outside render to avoid React hooks violation
function SortIcon({ field, currentSortField, currentSortDirection }: {
  field: SortField;
  currentSortField: SortField;
  currentSortDirection: SortDirection;
}) {
  if (currentSortField !== field) {
    return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />;
  }
  return currentSortDirection === "asc"
    ? <ArrowUp className="ml-1 h-3 w-3 text-blue-600" />
    : <ArrowDown className="ml-1 h-3 w-3 text-blue-600" />;
}

// Sortable header component - defined outside render to avoid React hooks violation
function SortableHeader({
  field,
  children,
  className = "",
  currentSortField,
  currentSortDirection,
  onSort
}: {
  field: SortField;
  children: React.ReactNode;
  className?: string;
  currentSortField: SortField;
  currentSortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  return (
    <th className={`pb-3 font-medium ${className}`}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        {children}
        <SortIcon field={field} currentSortField={currentSortField} currentSortDirection={currentSortDirection} />
      </button>
    </th>
  );
}

export function NonprofitTable({ nonprofits, onEdit, sortField, sortDirection, onSort }: NonprofitTableProps) {
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; nonprofit: Nonprofit | null; error: string | null }>({
    open: false,
    nonprofit: null,
    error: null,
  });

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

  const openDeleteModal = (nonprofit: Nonprofit) => {
    setDeleteModal({ open: true, nonprofit, error: null });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, nonprofit: null, error: null });
  };

  const confirmDelete = () => {
    if (!deleteModal.nonprofit) return;
    const id = deleteModal.nonprofit.id;
    setActionId(id);
    startTransition(async () => {
      const result = await deleteNonprofit(id);
      if (result.error) {
        setDeleteModal((prev) => ({ ...prev, error: result.error || "An error occurred" }));
      } else {
        closeDeleteModal();
      }
      setActionId(null);
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
            <SortableHeader field="name" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort}>Organization</SortableHeader>
            <SortableHeader field="ein" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort}>EIN</SortableHeader>
            <SortableHeader field="category" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort}>Category</SortableHeader>
            <SortableHeader field="status" currentSortField={sortField} currentSortDirection={sortDirection} onSort={onSort}>Status</SortableHeader>
            <th className="pb-3 font-medium text-right">
              <button
                onClick={() => onSort("total_received")}
                className="flex items-center ml-auto hover:text-blue-600 transition-colors"
              >
                Total Received
                <SortIcon field="total_received" currentSortField={sortField} currentSortDirection={sortDirection} />
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
                    className="text-purple-600 hover:bg-purple-50"
                    asChild
                    title="Manage users"
                  >
                    <Link href={`/admin/nonprofits/${nonprofit.id}`}>
                      <Users className="h-4 w-4" />
                    </Link>
                  </Button>
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
                    onClick={() => openDeleteModal(nonprofit)}
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

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModal.open} onClose={closeDeleteModal}>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Delete Nonprofit</h2>
              <p className="text-sm text-slate-500">This action cannot be undone</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {deleteModal.nonprofit && (
            <div className="space-y-4">
              {/* Nonprofit info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                {deleteModal.nonprofit.logo_url ? (
                  <img
                    src={deleteModal.nonprofit.logo_url}
                    alt={deleteModal.nonprofit.name}
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600 font-semibold">
                    {deleteModal.nonprofit.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-900">{deleteModal.nonprofit.name}</p>
                  {deleteModal.nonprofit.ein && (
                    <p className="text-xs text-slate-500">EIN: {deleteModal.nonprofit.ein}</p>
                  )}
                </div>
              </div>

              {/* Donation info */}
              {deleteModal.nonprofit.total_received > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TestTube className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Simulated Donations: {formatCurrency(deleteModal.nonprofit.total_received)}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        All simulated donations to this nonprofit will also be deleted.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning for real donations - shown if error indicates this */}
              {deleteModal.error && deleteModal.error.includes("real donations") && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Cannot Delete</p>
                      <p className="text-xs text-red-700 mt-1">
                        This nonprofit has real donations and cannot be deleted. Only nonprofits with simulated donations can be removed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Other errors */}
              {deleteModal.error && !deleteModal.error.includes("real donations") && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{deleteModal.error}</p>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={closeDeleteModal}
            disabled={isPending && actionId === deleteModal.nonprofit?.id}
          >
            Cancel
          </Button>
          {/* Only show delete button if there's no "real donations" error */}
          {(!deleteModal.error || !deleteModal.error.includes("real donations")) && (
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending && actionId === deleteModal.nonprofit?.id}
            >
              {isPending && actionId === deleteModal.nonprofit?.id ? "Deleting..." : "Delete Nonprofit"}
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
