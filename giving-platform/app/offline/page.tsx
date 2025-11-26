"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <WifiOff className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          You&apos;re Offline
        </h1>
        <p className="mt-2 text-slate-600 max-w-md mx-auto">
          It looks like you&apos;ve lost your internet connection. Please check your
          connection and try again.
        </p>
        <div className="mt-8">
          <Button
            onClick={() => window.location.reload()}
            className="inline-flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Some features of {config.appName} require an internet connection to work.
        </p>
      </div>
    </div>
  );
}
