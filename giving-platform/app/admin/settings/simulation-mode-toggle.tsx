"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleSimulationMode } from "./actions";
import { Loader2, Trash2 } from "lucide-react";

interface SimulationModeToggleProps {
  enabled: boolean;
}

export function SimulationModeToggle({ enabled }: SimulationModeToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [lastDeletedCount, setLastDeletedCount] = useState<number | null>(null);

  const handleToggle = () => {
    setLastDeletedCount(null);
    startTransition(async () => {
      const result = await toggleSimulationMode();
      if (result.success) {
        setIsEnabled(result.enabled);
        // Show deleted count when turning off simulation
        if (!result.enabled && result.deletedCount !== undefined && result.deletedCount > 0) {
          setLastDeletedCount(result.deletedCount);
        }
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">
            {isEnabled
              ? "Simulation mode is currently enabled. Donations will not process real payments."
              : "Enable simulation mode to test donations without real payments."
            }
          </p>
        </div>
        <Button
          variant={isEnabled ? "destructive" : "default"}
          onClick={handleToggle}
          disabled={isPending}
          className="min-w-[140px]"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEnabled ? "Clearing..." : "Enabling..."}
            </>
          ) : isEnabled ? (
            "Disable Simulation"
          ) : (
            "Enable Simulation"
          )}
        </Button>
      </div>

      {lastDeletedCount !== null && lastDeletedCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
          <Trash2 className="h-4 w-4" />
          <span>Cleared {lastDeletedCount} simulated donation{lastDeletedCount !== 1 ? "s" : ""} from the database.</span>
        </div>
      )}

      {isEnabled && (
        <p className="text-xs text-slate-500">
          When you disable simulation mode, all test donation data will be automatically cleared.
        </p>
      )}
    </div>
  );
}
