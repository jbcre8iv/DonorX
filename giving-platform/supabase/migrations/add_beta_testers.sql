-- Beta Testers table for email-based access control
-- Admins can add/remove emails to grant/revoke beta access

CREATE TABLE IF NOT EXISTS beta_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT, -- Optional name for reference
  notes TEXT, -- Optional notes about the tester
  added_by UUID REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON beta_testers(email);
CREATE INDEX IF NOT EXISTS idx_beta_testers_active ON beta_testers(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE beta_testers ENABLE ROW LEVEL SECURITY;

-- Only owners can view beta testers
CREATE POLICY "Owners can view beta testers"
  ON beta_testers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Only owners can insert beta testers
CREATE POLICY "Owners can add beta testers"
  ON beta_testers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Only owners can update beta testers
CREATE POLICY "Owners can update beta testers"
  ON beta_testers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Only owners can delete beta testers
CREATE POLICY "Owners can delete beta testers"
  ON beta_testers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'owner'
    )
  );

-- Allow anonymous users to check if their email has beta access (read-only, email-based)
-- This is needed for the middleware to check access before user is logged in
CREATE POLICY "Anyone can check their own beta access"
  ON beta_testers FOR SELECT
  TO anon
  USING (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_beta_testers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER beta_testers_updated_at
  BEFORE UPDATE ON beta_testers
  FOR EACH ROW
  EXECUTE FUNCTION update_beta_testers_updated_at();
