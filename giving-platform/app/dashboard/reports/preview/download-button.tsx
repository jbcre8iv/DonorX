"use client";

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pdf } from "@react-pdf/renderer";
import { QuarterlyReportPDF } from "@/lib/pdf/quarterly-report-template";

interface Allocation {
  nonprofitId: string;
  nonprofitName: string;
  category: string;
  totalAmount: number;
  percentage: number;
  donationCount: number;
}

interface ImpactHighlight {
  nonprofitName: string;
  reportTitle: string;
  reportDate?: string;
  content?: string;
  fundsUsed?: number;
  peopleServed?: number;
}

interface QuarterlyReportData {
  quarter: number;
  year: number;
  donorName: string;
  donorEmail: string;
  startDate: string;
  endDate: string;
  totalDonated: number;
  donationCount: number;
  nonprofitsSupported: number;
  allocations: Allocation[];
  impactHighlights: ImpactHighlight[];
  hasSimulated?: boolean;
}

interface DownloadQuarterlyReportButtonProps {
  reportData: QuarterlyReportData;
}

export function DownloadQuarterlyReportButton({ reportData }: DownloadQuarterlyReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<QuarterlyReportPDF data={reportData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DonorX-Q${reportData.quarter}-${reportData.year}-Impact-Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
