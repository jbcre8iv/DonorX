import { Download, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const receipts = [
  {
    id: "1",
    period: "Q4 2023",
    dateRange: "Oct 1 - Dec 31, 2023",
    totalAmount: 40000,
    donationCount: 3,
    status: "ready" as const,
  },
  {
    id: "2",
    period: "Q3 2023",
    dateRange: "Jul 1 - Sep 30, 2023",
    totalAmount: 35000,
    donationCount: 4,
    status: "ready" as const,
  },
  {
    id: "3",
    period: "Q2 2023",
    dateRange: "Apr 1 - Jun 30, 2023",
    totalAmount: 25000,
    donationCount: 2,
    status: "ready" as const,
  },
  {
    id: "4",
    period: "Q1 2023",
    dateRange: "Jan 1 - Mar 31, 2023",
    totalAmount: 25000,
    donationCount: 3,
    status: "ready" as const,
  },
];

const annualSummary = {
  year: 2023,
  totalDonated: 125000,
  totalDonations: 12,
  nonprofitsSupported: 18,
};

export const metadata = {
  title: "Tax Receipts",
};

export default function ReceiptsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Tax Receipts</h1>
        <p className="text-slate-600">
          Download your tax-deductible donation receipts
        </p>
      </div>

      {/* Annual Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-600">
                {annualSummary.year} Annual Summary
              </p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">
                {formatCurrency(annualSummary.totalDonated * 100)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {annualSummary.totalDonations} donations to{" "}
                {annualSummary.nonprofitsSupported} nonprofits
              </p>
            </div>
            <Button size="lg">
              <Download className="mr-2 h-5 w-5" />
              Download Annual Statement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <FileText className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {receipt.period}
                      </p>
                      <Badge variant="success">Ready</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {receipt.dateRange}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(receipt.totalAmount * 100)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {receipt.donationCount} donations
                    </p>
                  </div>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              All donations made through DonorX are tax-deductible to the extent
              allowed by law. Each receipt includes the EIN of the recipient
              nonprofit organization(s).
            </p>
            <p className="mt-2">
              For donations over $250, this receipt serves as your written
              acknowledgment as required by the IRS. Please consult with your tax
              advisor for specific guidance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
