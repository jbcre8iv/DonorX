"use client";

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pdf } from "@react-pdf/renderer";
import { DonationReceiptPDF } from "@/lib/pdf/receipt-template";

interface ReceiptData {
  donationId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  date: string;
  allocations: {
    name: string;
    ein?: string | null;
    amount: number;
    percentage: number;
  }[];
  isSimulated?: boolean;
}

interface DownloadReceiptButtonProps {
  receiptData: ReceiptData;
}

export function DownloadReceiptButton({ receiptData }: DownloadReceiptButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<DonationReceiptPDF data={receiptData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DonorX-Receipt-${receiptData.donationId.slice(0, 8).toUpperCase()}.pdf`;
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
  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Use setTimeout to ensure the click event is fully processed
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.print();
      }
    }, 100);
  };

  return (
    <Button type="button" variant="outline" onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
