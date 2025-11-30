import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSimulationMode } from "./actions";
import { SimulationModeToggle } from "./simulation-mode-toggle";
import { AlertTriangle, TestTube, CreditCard, FileText } from "lucide-react";

export const metadata = {
  title: "Admin Settings",
};

export default async function AdminSettingsPage() {
  const simulationEnabled = await getSimulationMode();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-purple-900">Settings</h1>
        <p className="text-purple-700/70">Platform configuration and testing options</p>
      </div>

      {/* Simulation Mode Card */}
      <Card className={simulationEnabled ? "border-amber-300 bg-amber-50/50" : ""}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${simulationEnabled ? "bg-amber-100" : "bg-slate-100"}`}>
              <TestTube className={`h-5 w-5 ${simulationEnabled ? "text-amber-600" : "text-slate-600"}`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Simulation Mode
                {simulationEnabled && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                    ACTIVE
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Test donations without processing real payments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimulationModeToggle enabled={simulationEnabled} />

          {simulationEnabled && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Simulation Mode is Active</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Donations will be recorded as &quot;simulated&quot; and will not process real payments.
                    This is useful for testing the complete workflow including receipts and reports.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-slate-900">What happens in simulation mode:</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">No Real Charges</p>
                  <p className="text-sm text-slate-500">Stripe checkout is bypassed entirely</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">Full Workflow</p>
                  <p className="text-sm text-slate-500">Receipts and reports work normally</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
