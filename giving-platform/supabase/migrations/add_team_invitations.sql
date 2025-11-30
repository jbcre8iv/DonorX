-- Team Invitations table
-- Allows organization admins to invite new team members

CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(organization_id, email, status) -- Prevent duplicate pending invites
);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_invitations

-- Admins/owners can view their org's invitations
CREATE POLICY "Org admins can view invitations" ON team_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Admins/owners can create invitations
CREATE POLICY "Org admins can create invitations" ON team_invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    AND invited_by = auth.uid()
  );

-- Admins/owners can update (cancel) invitations
CREATE POLICY "Org admins can update invitations" ON team_invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Admins/owners can delete invitations
CREATE POLICY "Org admins can delete invitations" ON team_invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Allow anyone to read their own invitation by token (for accepting)
-- This is handled via admin client in the app

-- Add RLS policy for users to view other members in their organization
CREATE POLICY "Users can view org members" ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Index for faster lookups
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_org_status ON team_invitations(organization_id, status);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
