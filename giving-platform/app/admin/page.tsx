import { Building2, CreditCard, Users, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const stats = [
  {
    title: "Total Donations",
    value: "$2.4M",
    change: "+18%",
    icon: DollarSign,
    color: "blue",
  },
  {
    title: "Active Donors",
    value: "156",
    change: "+12",
    icon: Users,
    color: "emerald",
  },
  {
    title: "Nonprofits",
    value: "89",
    change: "+5",
    icon: Building2,
    color: "purple",
  },
  {
    title: "This Month",
    value: "$245K",
    change: "+24%",
    icon: TrendingUp,
    color: "amber",
  },
];

const recentActivity = [
  {
    id: "1",
    type: "donation",
    description: "Acme Corp donated $25,000",
    date: "2024-01-15T10:30:00",
  },
  {
    id: "2",
    type: "nonprofit",
    description: "New nonprofit approved: Tech for Good",
    date: "2024-01-15T09:15:00",
  },
  {
    id: "3",
    type: "user",
    description: "New organization registered: Smith Family Office",
    date: "2024-01-14T16:45:00",
  },
  {
    id: "4",
    type: "donation",
    description: "Johnson Foundation donated $50,000",
    date: "2024-01-14T14:20:00",
  },
  {
    id: "5",
    type: "disbursement",
    description: "Disbursed $125,000 to 12 nonprofits",
    date: "2024-01-14T11:00:00",
  },
];

const pendingApprovals = [
  {
    id: "1",
    name: "Youth Education Initiative",
    ein: "12-3456789",
    submitted: "2024-01-14",
    category: "Education",
  },
  {
    id: "2",
    name: "Clean Water Project",
    ein: "23-4567890",
    submitted: "2024-01-13",
    category: "Environment",
  },
  {
    id: "3",
    name: "Mental Health Alliance",
    ein: "34-5678901",
    submitted: "2024-01-12",
    category: "Healthcare",
  },
];

export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Platform overview and management</p>
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
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    stat.color === "blue"
                      ? "bg-blue-100"
                      : stat.color === "emerald"
                      ? "bg-emerald-100"
                      : stat.color === "purple"
                      ? "bg-purple-100"
                      : "bg-amber-100"
                  }`}
                >
                  <stat.icon
                    className={`h-5 w-5 ${
                      stat.color === "blue"
                        ? "text-blue-700"
                        : stat.color === "emerald"
                        ? "text-emerald-700"
                        : stat.color === "purple"
                        ? "text-purple-700"
                        : "text-amber-700"
                    }`}
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-emerald-600">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                      activity.type === "donation"
                        ? "bg-emerald-100"
                        : activity.type === "nonprofit"
                        ? "bg-blue-100"
                        : activity.type === "user"
                        ? "bg-purple-100"
                        : "bg-amber-100"
                    }`}
                  >
                    {activity.type === "donation" ? (
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    ) : activity.type === "nonprofit" ? (
                      <Building2 className="h-4 w-4 text-blue-600" />
                    ) : activity.type === "user" ? (
                      <Users className="h-4 w-4 text-purple-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Approvals</CardTitle>
            <Badge variant="warning">{pendingApprovals.length} pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((nonprofit) => (
                <div
                  key={nonprofit.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{nonprofit.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>EIN: {nonprofit.ein}</span>
                      <span>|</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(nonprofit.submitted)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">{nonprofit.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
