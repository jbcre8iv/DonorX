import { Plus, Layers, Trash2, Edit, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const templates = [
  {
    id: "1",
    name: "My Default Allocation",
    isDefault: true,
    allocations: [
      { name: "Education First Foundation", percentage: 40 },
      { name: "Green Earth Initiative", percentage: 30 },
      { name: "Healthcare for All", percentage: 30 },
    ],
    lastUsed: "2024-01-15",
  },
  {
    id: "2",
    name: "Environment Focus",
    isDefault: false,
    allocations: [
      { name: "Green Earth Initiative", percentage: 50 },
      { name: "Environment Category", percentage: 50 },
    ],
    lastUsed: "2024-01-01",
  },
  {
    id: "3",
    name: "Equal Distribution",
    isDefault: false,
    allocations: [
      { name: "Education First Foundation", percentage: 25 },
      { name: "Green Earth Initiative", percentage: 25 },
      { name: "Healthcare for All", percentage: 25 },
      { name: "Food Bank Network", percentage: 25 },
    ],
    lastUsed: "2023-12-15",
  },
];

export const metadata = {
  title: "Allocation Templates",
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Allocation Templates
          </h1>
          <p className="text-slate-600">
            Save and reuse your favorite allocation configurations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Layers className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.isDefault && (
                      <Badge variant="default" className="mt-1">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {/* Allocation Breakdown */}
              <div className="space-y-2">
                {template.allocations.map((allocation, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 truncate mr-2">
                      {allocation.name}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {allocation.percentage}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
                {template.allocations.map((allocation, index) => {
                  const colors = [
                    "bg-blue-500",
                    "bg-emerald-500",
                    "bg-purple-500",
                    "bg-amber-500",
                  ];
                  return (
                    <div
                      key={index}
                      className={colors[index % colors.length]}
                      style={{ width: `${allocation.percentage}%` }}
                    />
                  );
                })}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100">
                <Button variant="default" size="sm" className="flex-1">
                  <Heart className="mr-2 h-4 w-4" />
                  Use Template
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Template Card */}
        <Card className="flex items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer transition-colors">
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900">Create New Template</p>
            <p className="mt-1 text-sm text-slate-500">
              Save your allocation preferences
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
