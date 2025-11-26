import { FileQuestion, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <FileQuestion className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-slate-700">
          Page Not Found
        </h2>
        <p className="mt-2 text-slate-600 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/directory">
              <Search className="mr-2 h-4 w-4" />
              Browse Directory
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
