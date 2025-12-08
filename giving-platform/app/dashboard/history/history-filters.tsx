"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface HistoryFiltersProps {
  years: number[];
}

export function HistoryFilters({ years }: HistoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";
  const currentYear = searchParams.get("year") || "all";

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", value);
    router.push(`/dashboard/history?${params.toString()}`);
  };

  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", value);
    router.push(`/dashboard/history?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex gap-4">
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={currentYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All Time</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
