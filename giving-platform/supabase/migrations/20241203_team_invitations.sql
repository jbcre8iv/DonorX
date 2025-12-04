-- Team Invitations Table with Enterprise Security
-- Secure token-based invitation system for team members

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Invitation details
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),

  -- Security: Store hashed token, not plaintext
  -- The actual token is sent via email, we only store the hash
  token_hash TEXT NOT NULL UNIQUE,

  -- Token metadata for security
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,

  -- Audit trail
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Security: IP and user agent logging for audit
  created_from_ip TEXT,
  accepted_from_ip TEXT
);

-- Index for fast token lookups (most common query)
CREATE INDEX idx_team_invitations_token_hash ON team_invitations(token_hash);

-- Index for listing invitations by status
CREATE INDEX idx_team_invitations_status ON team_invitations(status, created_at DESC);

-- Index for finding invitations by email
CREATE INDEX idx_team_invitations_email ON team_invitations(email);

-- RLS Policies
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Only owners can view all invitations
CREATE POLICY "Owners can view all invitations"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Only owners can create invitations
CREATE POLICY "Owners can create invitations"
  ON team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Only owners can update invitations (revoke)
CREATE POLICY "Owners can update invitations"
  ON team_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE team_invitations IS 'Secure team member invitation system with token hashing and audit trail';
COMMENT ON COLUMN team_invitations.token_hash IS 'SHA-256 hash of the invitation token - plaintext token is never stored';
COMMENT ON COLUMN team_invitations.expires_at IS 'Invitation expires after this time (default 7 days)';
COMMENT ON COLUMN team_invitations.max_uses IS 'Maximum times this invitation can be used (default 1)';
