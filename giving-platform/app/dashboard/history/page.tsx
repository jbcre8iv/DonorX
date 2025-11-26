import { CreditCard, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

const donations = [
  {
    id: "1",
    date: "2024-01-15",
    amount: 25000,
    recipients: ["Education First Foundation", "Green Earth Initiative", "Healthcare for All", "Food Bank Network"],
    status: "completed" as const,
  },
  {
    id: "2",
    date: "2024-01-01",
    amount: 10000,
    recipients: ["Healthcare for All"],
    status: "completed" as const,
  },
  {
    id: "3",
    date: "2023-12-15",
    amount: 15000,
    recipients: ["Food Bank Network", "Housing Hope"],
    status: "completed" as const,
  },
  {
    id: "4",
    date: "2023-12-01",
    amount: 20000,
    recipients: ["Education First Foundation", "Arts for Everyone"],
    status: "completed" as const,
  },
  {
    id: "5",
    date: "2023-11-15",
    amount: 5000,
    recipients: ["Green Earth Initiative"],
    status: "completed" as const,
  },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const yearOptions = [
  { value: "all", label: "All Time" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
];

export const metadata = {
  title: "Donation History",
};

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Donation History</h1>
        <p className="text-slate-600">View and manage your past donations</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input placeholder="Search donations..." />
            </div>
            <div className="flex gap-4">
              <Select options={statusOptions} />
              <Select options={yearOptions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(donation.amount * 100)}
                      </p>
                      <Badge variant="success">Completed</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(donation.date)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {donation.recipients.slice(0, 3).map((recipient) => (
                        <span
                          key={recipient}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                        >
                          {recipient}
                        </span>
                      ))}
                      {donation.recipients.length > 3 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          +{donation.recipients.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col sm:items-end">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
