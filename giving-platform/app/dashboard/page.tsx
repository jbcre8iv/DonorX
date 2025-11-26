import { CreditCard, TrendingUp, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const stats = [
  {
    title: "Total Donated",
    value: "$125,000",
    change: "+12%",
    icon: TrendingUp,
  },
  {
    title: "Donations This Year",
    value: "24",
    change: "+8",
    icon: CreditCard,
  },
  {
    title: "Nonprofits Supported",
    value: "18",
    change: "+3",
    icon: Calendar,
  },
  {
    title: "Tax Receipts",
    value: "4",
    change: "Q1-Q4",
    icon: FileText,
  },
];

const recentDonations = [
  {
    id: "1",
    date: "2024-01-15",
    amount: 25000,
    recipients: ["Education First", "Green Earth", "+2 more"],
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
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here&apos;s your giving overview.</p>
        </div>
        <Button asChild>
          <Link href="/donate">Make a Donation</Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.title}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <stat.icon className="h-5 w-5 text-blue-700" />
                </div>
              </div>
              <p className="mt-2 text-sm text-emerald-600">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Donations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Donations</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/history">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDonations.map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {formatCurrency(donation.amount * 100)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {donation.recipients.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="success">Completed</Badge>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(donation.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 mb-4">
              <CreditCard className="h-6 w-6 text-blue-700" />
            </div>
            <h3 className="font-semibold text-slate-900">Quick Donate</h3>
            <p className="mt-1 text-sm text-slate-600">
              Use your saved template
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 mb-4">
              <FileText className="h-6 w-6 text-emerald-700" />
            </div>
            <h3 className="font-semibold text-slate-900">Download Receipts</h3>
            <p className="mt-1 text-sm text-slate-600">
              Get your tax documents
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 mb-4">
              <TrendingUp className="h-6 w-6 text-purple-700" />
            </div>
            <h3 className="font-semibold text-slate-900">Impact Report</h3>
            <p className="mt-1 text-sm text-slate-600">
              See your giving impact
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
