import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1e293b",
  },
  header: {
    marginBottom: 30,
    borderBottom: "2px solid #3b82f6",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#0f172a",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottom: "1px solid #e2e8f0",
  },
  rowLabel: {
    color: "#64748b",
  },
  rowValue: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginTop: 10,
    borderTop: "2px solid #0f172a",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  allocationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 4,
    borderRadius: 4,
  },
  allocationName: {
    flex: 1,
    color: "#334155",
  },
  allocationAmount: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  allocationPercent: {
    color: "#64748b",
    marginLeft: 8,
    width: 40,
    textAlign: "right",
  },
  taxNotice: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    border: "1px solid #86efac",
  },
  taxNoticeTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 6,
  },
  taxNoticeText: {
    fontSize: 9,
    color: "#166534",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 15,
  },
  footerText: {
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
  },
  simulatedBadge: {
    backgroundColor: "#fef3c7",
    padding: "4 8",
    borderRadius: 4,
    marginBottom: 10,
  },
  simulatedText: {
    fontSize: 10,
    color: "#92400e",
    fontWeight: "bold",
    textAlign: "center",
  },
  watermarkContainer: {
    position: "absolute",
    top: 200,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  watermark: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#dc2626",
    opacity: 0.25,
    transform: "rotate(-35deg)",
    textAlign: "center",
    letterSpacing: 8,
  },
});

interface Allocation {
  name: string;
  ein?: string | null;
  amount: number;
  percentage: number;
}

interface ReceiptData {
  donationId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  date: string;
  allocations: Allocation[];
  isSimulated?: boolean;
}

export function DonationReceiptPDF({ data }: { data: ReceiptData }) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>DonorX</Text>
          <Text style={styles.subtitle}>Tax-Deductible Donation Receipt</Text>
        </View>

        {/* Simulated Badge */}
        {data.isSimulated && (
          <View style={styles.simulatedBadge}>
            <Text style={styles.simulatedText}>
              SIMULATED - FOR TESTING PURPOSES ONLY
            </Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>Donation Receipt</Text>

        {/* Donor Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donor Information</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{data.donorName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{data.donorEmail}</Text>
          </View>
        </View>

        {/* Donation Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donation Details</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Receipt Number</Text>
            <Text style={styles.rowValue}>{data.donationId.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>{data.date}</Text>
          </View>
        </View>

        {/* Allocations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allocation Breakdown</Text>
          {data.allocations.map((allocation, index) => (
            <View key={index} style={styles.allocationItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.allocationName}>{allocation.name}</Text>
                {allocation.ein && (
                  <Text style={{ fontSize: 9, color: "#94a3b8" }}>
                    EIN: {allocation.ein}
                  </Text>
                )}
              </View>
              <Text style={styles.allocationAmount}>
                {formatCurrency(allocation.amount)}
              </Text>
              <Text style={styles.allocationPercent}>{allocation.percentage}%</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Donation</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.amount)}</Text>
          </View>
        </View>

        {/* Tax Notice */}
        <View style={styles.taxNotice}>
          <Text style={styles.taxNoticeTitle}>Tax Deductibility Notice</Text>
          <Text style={styles.taxNoticeText}>
            This receipt confirms your tax-deductible donation. No goods or services
            were provided in exchange for this contribution. Please retain this
            receipt for your tax records. For donations over $250, this serves as
            your written acknowledgment as required by the IRS.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DonorX • Tax ID: XX-XXXXXXX • support@donorx.com
          </Text>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Watermark for simulated receipts - rendered last to appear on top */}
        {data.isSimulated && (
          <View style={styles.watermarkContainer} fixed>
            <Text style={styles.watermark}>SIMULATED</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
