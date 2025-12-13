import { Suspense } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DirectoryClient } from "./directory-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Nonprofit, Category } from "@/types/database";

export const metadata = {
  title: "Nonprofit Directory",
};

// Force dynamic rendering to always fetch fresh data from Supabase
export const dynamic = 'force-dynamic';

function DirectoryLoading() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto mt-4" />
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function DirectoryPage() {
  // Use admin client to bypass RLS for public directory
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (e) {
    console.error("[DirectoryPage] Admin client error:", e);
    adminClient = await createClient();
  }

  // Fetch categories
  const { data: categories } = await adminClient
    .from("categories")
    .select("*")
    .order("name");

  // Fetch approved nonprofits with their categories
  const { data: nonprofits, error } = await adminClient
    .from("nonprofits")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("name");

  if (error) {
    console.error("[DirectoryPage] Error fetching nonprofits:", error);
  }
  console.log("[DirectoryPage] Fetched nonprofits count:", nonprofits?.length ?? 0);

  return (
    <Suspense fallback={<DirectoryLoading />}>
      <DirectoryClient
        initialNonprofits={(nonprofits as Nonprofit[]) || []}
        categories={(categories as Category[]) || []}
      />
    </Suspense>
  );
}
