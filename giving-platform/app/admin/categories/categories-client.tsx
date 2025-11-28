"use client";

import { useState, useTransition } from "react";
import { Plus, Tag, Trash2, Edit, X, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createCategory, updateCategory, deleteCategory, generateCategoryInfo } from "./actions";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  nonprofit_count: number;
}

interface CategoriesClientProps {
  categories: Category[];
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Quick Fill state
  const [quickFillInput, setQuickFillInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    icon: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = editingCategory
        ? await updateCategory(editingCategory.id, formData)
        : await createCategory(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        setEditingCategory(null);
      }
    });
  };

  const handleDelete = (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.error) {
        alert(result.error);
      }
    });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setError(null);
    setQuickFillInput("");
    setFormValues({ name: "", description: "", icon: "" });
  };

  const handleQuickFill = async () => {
    if (!quickFillInput.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateCategoryInfo(quickFillInput);

      if (result.error) {
        setError(result.error);
      } else {
        setFormValues({
          name: result.name || "",
          description: result.description || "",
          icon: result.icon || "",
        });
      }
    } catch {
      setError("Failed to generate category info");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
          <p className="text-slate-600">
            Manage nonprofit categories ({categories.length} total)
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Tag className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{category.name}</h3>
                    <p className="text-sm text-slate-500">
                      {category.nonprofit_count} nonprofit
                      {category.nonprofit_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(category)}
                    disabled={category.nonprofit_count > 0}
                    title={
                      category.nonprofit_count > 0
                        ? "Cannot delete category with nonprofits"
                        : "Delete category"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {category.description && (
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                  {category.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center">
              <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No categories yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Add your first category to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Fill Section - only show for new categories */}
            {!editingCategory && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    AI Quick Fill
                  </span>
                </div>
                <p className="text-xs text-green-700 mb-3">
                  Enter a category name or description and let AI generate the details
                </p>
                <div className="flex gap-2">
                  <Input
                    value={quickFillInput}
                    onChange={(e) => setQuickFillInput(e.target.value)}
                    placeholder="e.g., religious, sports ministry, environment..."
                    className="flex-1 bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickFill();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleQuickFill}
                    disabled={isGenerating || !quickFillInput.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </span>
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>
                <Input
                  name="name"
                  value={editingCategory ? undefined : formValues.name}
                  defaultValue={editingCategory?.name || ""}
                  onChange={editingCategory ? undefined : (e) => setFormValues({ ...formValues, name: e.target.value })}
                  placeholder="e.g., Education"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editingCategory ? undefined : formValues.description}
                  defaultValue={editingCategory?.description || ""}
                  onChange={editingCategory ? undefined : (e) => setFormValues({ ...formValues, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Icon (optional)
                </label>
                <Input
                  name="icon"
                  value={editingCategory ? undefined : formValues.icon}
                  defaultValue={editingCategory?.icon || ""}
                  onChange={editingCategory ? undefined : (e) => setFormValues({ ...formValues, icon: e.target.value })}
                  placeholder="Icon name or emoji"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending
                    ? "Saving..."
                    : editingCategory
                    ? "Save Changes"
                    : "Add Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
