"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Mail,
  User,
  StickyNote,
  Ban,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
  Search
} from "lucide-react";
import { addBetaTester, revokeBetaAccess, restoreBetaAccess } from "./actions";

interface BetaTester {
  id: string;
  email: string;
  name: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  added_by_user?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

interface BetaTestersClientProps {
  initialTesters: BetaTester[];
}

export function BetaTestersClient({ initialTesters }: BetaTestersClientProps) {
  const [testers, setTesters] = useState(initialTesters);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const handleAddTester = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsAdding(true);

    const formData = new FormData(e.currentTarget);
    const result = await addBetaTester(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.message || "Beta tester added successfully");
      (e.target as HTMLFormElement).reset();
      // Refresh the page to get updated list
      window.location.reload();
    }

    setIsAdding(false);
  };

  const handleRevoke = async (id: string) => {
    setLoadingId(id);
    const result = await revokeBetaAccess(id);
    if (result.error) {
      setError(result.error);
    } else {
      setTesters(testers.map(t => t.id === id ? { ...t, is_active: false } : t));
    }
    setLoadingId(null);
  };

  const handleRestore = async (id: string) => {
    setLoadingId(id);
    const result = await restoreBetaAccess(id);
    if (result.error) {
      setError(result.error);
    } else {
      setTesters(testers.map(t => t.id === id ? { ...t, is_active: true } : t));
    }
    setLoadingId(null);
  };

  const filteredTesters = testers.filter(t => {
    const matchesSearch =
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = showInactive ? true : t.is_active;
    return matchesSearch && matchesStatus;
  });

  const activeCount = testers.filter(t => t.is_active).length;
  const inactiveCount = testers.filter(t => !t.is_active).length;

  return (
    <div className="space-y-6">
      {/* Add New Beta Tester */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-purple-600" />
            Add Beta Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTester} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  <Mail className="h-3.5 w-3.5 inline mr-1" />
                  Email *
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="tester@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  <User className="h-3.5 w-3.5 inline mr-1" />
                  Name (optional)
                </label>
                <Input
                  name="name"
                  type="text"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  <StickyNote className="h-3.5 w-3.5 inline mr-1" />
                  Notes (optional)
                </label>
                <Input
                  name="notes"
                  type="text"
                  placeholder="VIP client, priority tester..."
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}

            <Button type="submit" disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Beta Tester
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Beta Testers List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Beta Testers</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {activeCount} active{inactiveCount > 0 && `, ${inactiveCount} revoked`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Show revoked
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTesters.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchQuery ? "No testers match your search" : "No beta testers added yet"}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTesters.map((tester) => (
                <div
                  key={tester.id}
                  className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !tester.is_active ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">
                        {tester.email}
                      </span>
                      <Badge variant={tester.is_active ? "success" : "secondary"}>
                        {tester.is_active ? "Active" : "Revoked"}
                      </Badge>
                    </div>
                    {(tester.name || tester.notes) && (
                      <div className="mt-1 text-sm text-slate-500">
                        {tester.name && <span>{tester.name}</span>}
                        {tester.name && tester.notes && <span> &middot; </span>}
                        {tester.notes && <span className="italic">{tester.notes}</span>}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-slate-400">
                      Added {new Date(tester.created_at).toLocaleDateString()}
                      {tester.added_by_user && (
                        <> by {tester.added_by_user.first_name || tester.added_by_user.email}</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tester.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(tester.id)}
                        disabled={loadingId === tester.id}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        {loadingId === tester.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(tester.id)}
                        disabled={loadingId === tester.id}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      >
                        {loadingId === tester.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
