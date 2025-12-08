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
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  allocationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 4,
    borderRadius: 4,
  },
  allocationLeft: {
    flex: 1,
    paddingRight: 10,
  },
  allocationName: {
    color: "#334155",
    fontSize: 11,
    marginBottom: 2,
  },
  allocationCategory: {
    fontSize: 9,
    color: "#94a3b8",
  },
  allocationAmount: {
    fontWeight: "bold",
    color: "#0f172a",
    width: 100,
    textAlign: "right",
    fontSize: 11,
  },
  allocationPercent: {
    color: "#64748b",
    width: 40,
    textAlign: "right",
    fontSize: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  impactItem: {
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    marginBottom: 8,
    borderLeft: "3px solid #10b981",
  },
  impactTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 4,
  },
  impactOrg: {
    fontSize: 9,
    color: "#166534",
    marginBottom: 4,
  },
  impactContent: {
    fontSize: 10,
    color: "#166534",
    lineHeight: 1.4,
  },
  impactStats: {
    flexDirection: "row",
    marginTop: 6,
    gap: 12,
  },
  impactStat: {
    fontSize: 9,
    color: "#166534",
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

export function QuarterlyReportPDF({ data }: { data: QuarterlyReportData }) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const quarterLabel = `Q${data.quarter} ${data.year}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>DonorX</Text>
          <Text style={styles.subtitle}>Quarterly Impact Report</Text>
        </View>

        {/* Simulated Badge */}
        {data.hasSimulated && (
          <View style={styles.simulatedBadge}>
            <Text style={styles.simulatedText}>
              INCLUDES SIMULATED DATA - FOR TESTING PURPOSES ONLY
            </Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{quarterLabel} Impact Report</Text>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Donated</Text>
            <Text style={styles.statValue}>{formatCurrency(data.totalDonated)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Donations Made</Text>
            <Text style={styles.statValue}>{data.donationCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Nonprofits Supported</Text>
            <Text style={styles.statValue}>{data.nonprofitsSupported}</Text>
          </View>
        </View>

        {/* Date Range */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>
            Report Period: {data.startDate} - {data.endDate}
          </Text>
        </View>

        {/* Allocations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allocation Breakdown</Text>
          {data.allocations.slice(0, 8).map((allocation, index) => (
            <View key={index}>
              <View style={styles.allocationItem}>
                <View style={styles.allocationLeft}>
                  <Text style={styles.allocationName}>{allocation.nonprofitName}</Text>
                  <Text style={styles.allocationCategory}>{allocation.category}</Text>
                </View>
                <Text style={styles.allocationAmount}>{formatCurrency(allocation.totalAmount)}</Text>
                <Text style={styles.allocationPercent}>{allocation.percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${allocation.percentage}%` }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Impact Highlights */}
        {data.impactHighlights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Impact Highlights</Text>
            {data.impactHighlights.slice(0, 4).map((highlight, index) => (
              <View key={index} style={styles.impactItem}>
                <Text style={styles.impactTitle}>{highlight.reportTitle}</Text>
                <Text style={styles.impactOrg}>{highlight.nonprofitName}</Text>
                {highlight.content && (
                  <Text style={styles.impactContent}>
                    {highlight.content.length > 200 ? highlight.content.slice(0, 200) + "..." : highlight.content}
                  </Text>
                )}
                <View style={styles.impactStats}>
                  {highlight.fundsUsed && (
                    <Text style={styles.impactStat}>
                      {formatCurrency(highlight.fundsUsed)} used
                    </Text>
                  )}
                  {highlight.peopleServed && (
                    <Text style={styles.impactStat}>
                      {highlight.peopleServed.toLocaleString()} people served
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DonorX • {quarterLabel} Impact Report • {data.donorName}
          </Text>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Watermark for simulated reports - rendered last to appear on top */}
        {data.hasSimulated && (
          <View style={styles.watermarkContainer} fixed>
            <Text style={styles.watermark}>SIMULATED</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
