import { Download, Search, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const donations = [
  {
    id: "DON-001",
    organization: "Acme Corporation",
    amount: 25000,
    allocations: 4,
    status: "completed" as const,
    date: "2024-01-15",
    disbursed: true,
  },
  {
    id: "DON-002",
    organization: "Smith Family Office",
    amount: 50000,
    allocations: 6,
    status: "completed" as const,
    date: "2024-01-14",
    disbursed: true,
  },
  {
    id: "DON-003",
    organization: "Johnson Foundation",
    amount: 10000,
    allocations: 2,
    status: "completed" as const,
    date: "2024-01-13",
    disbursed: false,
  },
  {
    id: "DON-004",
    organization: "Tech Corp",
    amount: 15000,
    allocations: 3,
    status: "processing" as const,
    date: "2024-01-13",
    disbursed: false,
  },
  {
    id: "DON-005",
    organization: "Global Ventures",
    amount: 100000,
    allocations: 8,
    status: "completed" as const,
    date: "2024-01-12",
    disbursed: true,
  },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
];

const disbursementOptions = [
  { value: "all", label: "All" },
  { value: "disbursed", label: "Disbursed" },
  { value: "pending", label: "Pending Disbursement" },
];

const summary = {
  totalDonations: 245,
  totalAmount: 2450000,
  pendingDisbursement: 125000,
  thisMonth: 245000,
};

export const metadata = {
  title: "Manage Donations",
};

export default function AdminDonationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Donations</h1>
          <p className="text-slate-600">View and manage all donations</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total Donations</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {summary.totalDonations}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total Amount</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(summary.totalAmount * 100)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Pending Disbursement</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">
              {formatCurrency(summary.pendingDisbursement * 100)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">This Month</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {formatCurrency(summary.thisMonth * 100)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search by ID or organization..." className="pl-10" />
            </div>
            <div className="flex gap-4">
              <Select options={statusOptions} />
              <Select options={disbursementOptions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Organization</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-center">Allocations</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Disbursed</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {donations.map((donation) => (
                  <tr key={donation.id} className="text-sm">
                    <td className="py-4 font-mono text-slate-600">
                      {donation.id}
                    </td>
                    <td className="py-4">
                      <p className="font-medium text-slate-900">
                        {donation.organization}
                      </p>
                    </td>
                    <td className="py-4 text-slate-600">
                      {formatDate(donation.date)}
                    </td>
                    <td className="py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(donation.amount * 100)}
                    </td>
                    <td className="py-4 text-center text-slate-600">
                      {donation.allocations}
                    </td>
                    <td className="py-4">
                      <Badge
                        variant={
                          donation.status === "completed"
                            ? "success"
                            : donation.status === "processing"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {donation.status}
                      </Badge>
                    </td>
                    <td className="py-4">
                      {donation.disbursed ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
