"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NonprofitTable } from "./nonprofit-table";
import { NonprofitForm } from "./nonprofit-form";

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

interface Category {
  id: string;
  name: string;
}

interface NonprofitsClientProps {
  nonprofits: Nonprofit[];
  categories: Category[];
}

export function NonprofitsClient({ nonprofits, categories }: NonprofitsClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingNonprofit, setEditingNonprofit] = useState<Nonprofit | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleEdit = (nonprofit: Nonprofit) => {
    setEditingNonprofit(nonprofit);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingNonprofit(null);
  };

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
    { value: "missing_ein", label: "Missing EIN" },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const filteredNonprofits = useMemo(() => {
    return nonprofits.filter((np) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = np.name.toLowerCase().includes(query);
        const matchesEin = np.ein?.toLowerCase().includes(query);
        if (!matchesName && !matchesEin) return false;
      }

      // Status filter
      if (statusFilter === "missing_ein") {
        if (np.ein) return false;
      } else if (statusFilter !== "all" && np.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && np.category_id !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [nonprofits, searchQuery, statusFilter, categoryFilter]);

  const pendingCount = nonprofits.filter((np) => np.status === "pending").length;
  const approvedCount = nonprofits.filter((np) => np.status === "approved").length;
  const missingEinCount = nonprofits.filter((np) => !np.ein).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nonprofits</h1>
          <p className="text-slate-600">
            {approvedCount} approved, {pendingCount} pending
            {missingEinCount > 0 && (
              <span className="text-amber-600"> ({missingEinCount} missing EIN)</span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Nonprofit
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name or EIN..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              <Select
                options={categoryOptions}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nonprofits Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredNonprofits.length === nonprofits.length
              ? `All Nonprofits (${nonprofits.length})`
              : `Showing ${filteredNonprofits.length} of ${nonprofits.length}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNonprofits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No nonprofits found</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first nonprofit to get started"}
              </p>
            </div>
          ) : (
            <NonprofitTable nonprofits={filteredNonprofits} onEdit={handleEdit} />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <NonprofitForm
          nonprofit={editingNonprofit}
          categories={categories}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
