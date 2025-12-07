"use client";

import { Heart, Building2, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface ImpactCounterProps {
  totalDonated: number;
  nonprofitsSupported: number;
  totalDonations: number;
  yearsGiving: number;
}

export function ImpactCounter({
  totalDonated,
  nonprofitsSupported,
  totalDonations,
  yearsGiving,
}: ImpactCounterProps) {
  const stats = [
    {
      label: "Total Given",
      value: Math.round(totalDonated / 100), // Convert cents to dollars
      prefix: "$",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: nonprofitsSupported === 1 ? "Organization" : "Organizations",
      value: nonprofitsSupported,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: totalDonations === 1 ? "Donation" : "Donations",
      value: totalDonations,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      label: yearsGiving === 1 ? "Year Giving" : "Years Giving",
      value: yearsGiving,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Your Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
            >
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-base font-bold ${stat.color}`}>
                  <AnimatedNumber
                    value={stat.value}
                    prefix={stat.prefix || ""}
                  />
                </div>
                <div className="text-[10px] text-slate-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
