"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DebugDonationsProps {
  userId: string;
  quarter: number;
  year: number;
}

function getQuarterDates(quarter: number, year: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  return { start, end };
}

export function DebugDonations({ userId, quarter, year }: DebugDonationsProps) {
  const [donations, setDonations] = useState<any[]>([]);
  const [allDonations, setAllDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDonations() {
      const supabase = createClient();
      const { start, end } = getQuarterDates(quarter, year);

      // Get donations for this quarter
      const { data: quarterDonations, error: quarterError } = await supabase
        .from("donations")
        .select("id, amount_cents, created_at, status, user_id")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      // Get ALL donations for this user
      const { data: allUserDonations, error: allError } = await supabase
        .from("donations")
        .select("id, amount_cents, created_at, status, user_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (quarterError) {
        setError(quarterError.message);
      } else {
        setDonations(quarterDonations || []);
      }

      if (!allError) {
        setAllDonations(allUserDonations || []);
      }

      setLoading(false);
    }

    fetchDonations();
  }, [userId, quarter, year]);

  const { start, end } = getQuarterDates(quarter, year);

  if (loading) return <p>Loading donations...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="mt-4 pt-4 border-t border-amber-300">
      <p className="font-bold">Date Range:</p>
      <p>Start: {start.toISOString()}</p>
      <p>End: {end.toISOString()}</p>

      <p className="font-bold mt-2">Q{quarter} {year} Donations ({donations.length}):</p>
      {donations.length === 0 ? (
        <p className="text-red-600">No donations found in this date range</p>
      ) : (
        donations.map((d) => (
          <p key={d.id} className="text-xs">
            {d.created_at} | ${(d.amount_cents / 100).toFixed(2)} | {d.status}
          </p>
        ))
      )}

      <p className="font-bold mt-2">Recent Donations (any time, limit 5):</p>
      {allDonations.length === 0 ? (
        <p className="text-red-600">No donations found for this user at all</p>
      ) : (
        allDonations.map((d) => (
          <p key={d.id} className="text-xs">
            {d.created_at} | ${(d.amount_cents / 100).toFixed(2)} | {d.status} | user: {d.user_id.substring(0, 8)}...
          </p>
        ))
      )}
    </div>
  );
}
