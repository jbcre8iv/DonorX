import { Plus, Search, MoreVertical, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const nonprofits = [
  {
    id: "1",
    name: "Education First Foundation",
    ein: "12-3456789",
    category: "Education",
    status: "approved" as const,
    featured: true,
    totalReceived: 125000,
    website: "https://example.com",
  },
  {
    id: "2",
    name: "Green Earth Initiative",
    ein: "23-4567890",
    category: "Environment",
    status: "approved" as const,
    featured: true,
    totalReceived: 98000,
    website: "https://example.com",
  },
  {
    id: "3",
    name: "Healthcare for All",
    ein: "34-5678901",
    category: "Healthcare",
    status: "approved" as const,
    featured: false,
    totalReceived: 75000,
    website: "https://example.com",
  },
  {
    id: "4",
    name: "Youth Education Initiative",
    ein: "45-6789012",
    category: "Education",
    status: "pending" as const,
    featured: false,
    totalReceived: 0,
    website: null,
  },
  {
    id: "5",
    name: "Clean Water Project",
    ein: "56-7890123",
    category: "Environment",
    status: "pending" as const,
    featured: false,
    totalReceived: 0,
    website: "https://example.com",
  },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "education", label: "Education" },
  { value: "environment", label: "Environment" },
  { value: "healthcare", label: "Healthcare" },
  { value: "hunger", label: "Hunger Relief" },
];

export const metadata = {
  title: "Manage Nonprofits",
};

export default function AdminNonprofitsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nonprofits</h1>
          <p className="text-slate-600">Manage nonprofit organizations</p>
        </div>
        <Button>
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
              <Input placeholder="Search nonprofits..." className="pl-10" />
            </div>
            <div className="flex gap-4">
              <Select options={statusOptions} />
              <Select options={categoryOptions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nonprofits Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Nonprofits ({nonprofits.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-semibold">
                          {nonprofit.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {nonprofit.name}
                            </p>
                            {nonprofit.featured && (
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
                    <td className="py-4 text-slate-600">{nonprofit.ein}</td>
                    <td className="py-4">
                      <Badge variant="secondary">{nonprofit.category}</Badge>
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
                      ${nonprofit.totalReceived.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {nonprofit.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:bg-emerald-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
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
