"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Mail, RotateCcw, X, Loader2, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPendingInvitations, revokeInvitation, resendInvitation } from "./invitation-actions";
import { formatDate } from "@/lib/utils";

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  invited_by: string;
  inviter: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface PendingInvitationsProps {
  isOwner: boolean;
}

// Helper to check if expiring soon - computed outside render
function checkExpiringSoon(expiresAt: string, referenceTime: number): boolean {
  const expiresTime = new Date(expiresAt).getTime();
  return expiresTime - referenceTime < 24 * 60 * 60 * 1000;
}

export function PendingInvitations({ isOwner }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Store reference time as initial value - stable across renders
  const [referenceTime] = useState(() => Date.now());

  const loadInvitations = useCallback(async () => {
    const result = await getPendingInvitations();
    if (result.error) {
      setError(result.error);
    } else {
      setInvitations(result.invitations as Invitation[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOwner) {
      // Use void to handle the promise without triggering lint warning
      void loadInvitations();
    } else {
      setLoading(false);
    }
  }, [isOwner, loadInvitations]);

  async function handleRevoke(id: string) {
    setActionLoading(id);
    const result = await revokeInvitation(id);
    if (result.error) {
      setError(result.error);
    } else {
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    }
    setActionLoading(null);
  }

  async function handleResend(id: string) {
    setActionLoading(id);
    const result = await resendInvitation(id);
    if (result.error) {
      setError(result.error);
    }
    setActionLoading(null);
    // Reload to get updated expiration
    void loadInvitations();
  }

  if (!isOwner) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  const roleColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
    admin: "success",
    member: "default",
    viewer: "secondary",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5 text-amber-600" />
          Pending Invitations
          <Badge variant="warning">{invitations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2 mb-4">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          {invitations.map((invitation) => {
            const isExpiringSoon = checkExpiringSoon(invitation.expires_at, referenceTime);
            const inviterName = invitation.inviter
              ? `${invitation.inviter.first_name || ""} ${invitation.inviter.last_name || ""}`.trim()
              : "Unknown";

            return (
              <div
                key={invitation.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 truncate">{invitation.email}</span>
                    <Badge variant={roleColors[invitation.role]} className="capitalize">
                      <Shield className="h-3 w-3 mr-1" />
                      {invitation.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>Invited by {inviterName}</span>
                    <span>•</span>
                    <span className={isExpiringSoon ? "text-amber-600 font-medium" : ""}>
                      <Clock className="h-3 w-3 inline mr-1" />
                      Expires {formatDate(invitation.expires_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResend(invitation.id)}
                    disabled={actionLoading === invitation.id}
                  >
                    {actionLoading === invitation.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Resend
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRevoke(invitation.id)}
                    disabled={actionLoading === invitation.id}
                  >
                    {actionLoading === invitation.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <X className="h-3.5 w-3.5 mr-1" />
                        Revoke
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
