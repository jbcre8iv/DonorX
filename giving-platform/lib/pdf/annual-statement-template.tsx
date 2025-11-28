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
  summaryBox: {
    backgroundColor: "#f0fdf4",
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryLabel: {
    color: "#166534",
  },
  summaryValue: {
    fontWeight: "bold",
    color: "#166534",
  },
  donationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 4,
    borderRadius: 4,
  },
  donationDate: {
    width: 80,
    color: "#64748b",
    fontSize: 10,
  },
  donationRecipients: {
    flex: 1,
    color: "#334155",
    fontSize: 10,
  },
  donationAmount: {
    fontWeight: "bold",
    color: "#0f172a",
    width: 80,
    textAlign: "right",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#e2e8f0",
    marginBottom: 4,
    borderRadius: 4,
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 10,
    color: "#475569",
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
  taxNotice: {
    marginTop: 20,
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
});

interface Donation {
  id: string;
  date: string;
  amount: number;
  recipients: string[];
  isSimulated?: boolean;
}

interface AnnualStatementData {
  year: number;
  donorName: string;
  donorEmail: string;
  donations: Donation[];
  totalAmount: number;
  totalDonations: number;
  hasSimulated?: boolean;
}

export function AnnualStatementPDF({ data }: { data: AnnualStatementData }) {
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
          <Text style={styles.subtitle}>Annual Giving Statement</Text>
        </View>

        {/* Simulated Badge */}
        {data.hasSimulated && (
          <View style={styles.simulatedBadge}>
            <Text style={styles.simulatedText}>
              INCLUDES SIMULATED DONATIONS - FOR TESTING PURPOSES ONLY
            </Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{data.year} Annual Statement</Text>

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

        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Annual Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Donations</Text>
            <Text style={styles.summaryValue}>{data.totalDonations}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.totalAmount)}</Text>
          </View>
        </View>

        {/* Donations Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donation Details</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: 80 }]}>Date</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Recipients</Text>
            <Text style={[styles.tableHeaderText, { width: 80, textAlign: "right" }]}>Amount</Text>
          </View>
          {data.donations.map((donation, index) => (
            <View key={index} style={styles.donationItem}>
              <Text style={styles.donationDate}>{donation.date}</Text>
              <Text style={styles.donationRecipients}>
                {donation.recipients.slice(0, 2).join(", ")}
                {donation.recipients.length > 2 && ` +${donation.recipients.length - 2} more`}
              </Text>
              <Text style={styles.donationAmount}>{formatCurrency(donation.amount)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total {data.year}</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.totalAmount)}</Text>
          </View>
        </View>

        {/* Tax Notice */}
        <View style={styles.taxNotice}>
          <Text style={styles.taxNoticeTitle}>Tax Deductibility Notice</Text>
          <Text style={styles.taxNoticeText}>
            This statement summarizes your tax-deductible donations for the {data.year} tax year.
            No goods or services were provided in exchange for these contributions. Please retain
            this statement for your tax records. For donations over $250, individual receipts are
            available and serve as written acknowledgment as required by the IRS.
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
      </Page>
    </Document>
  );
}
