"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleSimulationMode } from "./actions";
import { Loader2 } from "lucide-react";

interface SimulationModeToggleProps {
  enabled: boolean;
}

export function SimulationModeToggle({ enabled }: SimulationModeToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(enabled);

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleSimulationMode();
      if (result.success) {
        setIsEnabled(result.enabled);
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

      {isEnabled && (
        <p className="text-xs text-slate-500">
          Simulation mode allows you to test the donation flow without processing real payments.
        </p>
      )}
    </div>
  );
}
