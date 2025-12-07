"use client";

import { CreditCard, TrendingUp, Building2, FileText } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent } from "@/components/ui/card";

interface StatsGridProps {
  totalDonated: number;
  donationsCount: number;
  nonprofitsCount: number;
  receiptsCount: number;
  subtitleTotal: string;
  subtitleDonations: string;
}

const ICONS = {
  TrendingUp,
  CreditCard,
  Building2,
  FileText,
};

export function StatsGrid({
  totalDonated,
  donationsCount,
  nonprofitsCount,
  receiptsCount,
  subtitleTotal,
  subtitleDonations,
}: StatsGridProps) {
  const stats = [
    {
      title: "Total Donated",
      value: totalDonated,
      subtitle: subtitleTotal,
      icon: ICONS.TrendingUp,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-700",
      isCurrency: true,
    },
    {
      title: "Donations",
      value: donationsCount,
      subtitle: subtitleDonations,
      icon: ICONS.CreditCard,
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-700",
      isCurrency: false,
    },
    {
      title: "Nonprofits Supported",
      value: nonprofitsCount,
      subtitle: "Organizations",
      icon: ICONS.Building2,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-700",
      isCurrency: false,
    },
    {
      title: "Tax Receipts",
      value: receiptsCount,
      subtitle: "Available",
      icon: ICONS.FileText,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-700",
      isCurrency: false,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">{stat.title}</p>
                <p className="mt-0.5 text-xl font-semibold text-slate-900">
                  {stat.isCurrency ? (
                    <AnimatedNumber value={stat.value} prefix="$" format="currency" />
                  ) : (
                    <AnimatedNumber value={stat.value} format="number" />
                  )}
                </p>
              </div>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
