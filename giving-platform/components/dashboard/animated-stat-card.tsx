"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface AnimatedStatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  isCurrency?: boolean;
}

export function AnimatedStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  bgColor,
  iconColor,
  isCurrency = false,
}: AnimatedStatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-600">{title}</p>
            <p className="mt-0.5 text-xl font-semibold text-slate-900">
              {isCurrency ? (
                <AnimatedNumber value={value} prefix="$" format="currency" />
              ) : (
                <AnimatedNumber value={value} format="number" />
              )}
            </p>
          </div>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgColor}`}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
