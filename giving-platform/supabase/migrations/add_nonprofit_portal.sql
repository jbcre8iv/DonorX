-- Migration: Nonprofit Portal - Users and Invitations
-- Allows nonprofits to self-manage their profiles, goals, and impact reports

-- Link users to nonprofits with roles
CREATE TABLE nonprofit_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nonprofit_id, user_id)
);

-- Nonprofit invitations for onboarding
CREATE TABLE nonprofit_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token VARCHAR(64) NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_nonprofit_users_nonprofit ON nonprofit_users(nonprofit_id);
CREATE INDEX idx_nonprofit_users_user ON nonprofit_users(user_id);
CREATE INDEX idx_nonprofit_invitations_token ON nonprofit_invitations(token) WHERE accepted_at IS NULL;
CREATE INDEX idx_nonprofit_invitations_email ON nonprofit_invitations(email) WHERE accepted_at IS NULL;

-- Enable RLS
ALTER TABLE nonprofit_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nonprofit_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nonprofit_users

-- Platform admins can see all nonprofit users
CREATE POLICY "Platform admins can manage all nonprofit users"
  ON nonprofit_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Users can see their own nonprofit memberships
CREATE POLICY "Users can view their own nonprofit memberships"
  ON nonprofit_users FOR SELECT
  USING (user_id = auth.uid());

-- Nonprofit admins can manage users in their nonprofit
CREATE POLICY "Nonprofit admins can manage their team"
  ON nonprofit_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nonprofit_users nu
      WHERE nu.nonprofit_id = nonprofit_users.nonprofit_id
      AND nu.user_id = auth.uid()
      AND nu.role = 'admin'
    )
  );

-- RLS Policies for nonprofit_invitations

-- Platform admins can manage all invitations
CREATE POLICY "Platform admins can manage all invitations"
  ON nonprofit_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Nonprofit admins can manage invitations for their nonprofit
CREATE POLICY "Nonprofit admins can manage their invitations"
  ON nonprofit_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nonprofit_users
      WHERE nonprofit_users.nonprofit_id = nonprofit_invitations.nonprofit_id
      AND nonprofit_users.user_id = auth.uid()
      AND nonprofit_users.role = 'admin'
    )
  );

-- Anyone can read invitation by token (for accepting)
CREATE POLICY "Anyone can read invitation by token"
  ON nonprofit_invitations FOR SELECT
  USING (TRUE);

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invitation token
CREATE OR REPLACE FUNCTION set_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := generate_invitation_token();
  END IF;
  -- Set default expiration to 7 days
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invitation_token_auto_generate
  BEFORE INSERT ON nonprofit_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_token();

-- Add contact_email to nonprofits for primary contact
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'US';
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Update nonprofits RLS to allow nonprofit users to update their own profile
CREATE POLICY "Nonprofit users can update their nonprofit profile"
  ON nonprofits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM nonprofit_users
      WHERE nonprofit_users.nonprofit_id = nonprofits.id
      AND nonprofit_users.user_id = auth.uid()
      AND nonprofit_users.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nonprofit_users
      WHERE nonprofit_users.nonprofit_id = nonprofits.id
      AND nonprofit_users.user_id = auth.uid()
      AND nonprofit_users.role IN ('admin', 'editor')
    )
  );

-- Allow nonprofit users to view their own nonprofit (even if pending)
CREATE POLICY "Nonprofit users can view their nonprofit"
  ON nonprofits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nonprofit_users
      WHERE nonprofit_users.nonprofit_id = nonprofits.id
      AND nonprofit_users.user_id = auth.uid()
    )
  );

-- Update impact_reports RLS to allow nonprofit users to manage their reports
CREATE POLICY "Nonprofit users can manage their impact reports"
  ON impact_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nonprofit_users
      WHERE nonprofit_users.nonprofit_id = impact_reports.nonprofit_id
      AND nonprofit_users.user_id = auth.uid()
      AND nonprofit_users.role IN ('admin', 'editor')
    )
  );

-- Allow nonprofit users to view their own reports
CREATE POLICY "Nonprofit users can view their impact reports"
  ON impact_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nonprofit_users
      WHERE nonprofit_users.nonprofit_id = impact_reports.nonprofit_id
      AND nonprofit_users.user_id = auth.uid()
    )
  );
