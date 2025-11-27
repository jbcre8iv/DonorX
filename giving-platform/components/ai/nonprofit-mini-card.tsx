"use client";

import Link from "next/link";
import { ExternalLink, Heart } from "lucide-react";

interface NonprofitMiniCardProps {
  id: string;
  name: string;
}

export function NonprofitMiniCard({ id, name }: NonprofitMiniCardProps) {
  return (
    <Link
      href={`/directory/${id}`}
      className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm transition-colors group my-1"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 group-hover:bg-emerald-200 text-emerald-600">
        <Heart className="h-3 w-3" />
      </div>
      <span className="font-medium text-emerald-900">{name}</span>
      <ExternalLink className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
