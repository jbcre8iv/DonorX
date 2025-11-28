-- Add simulation mode setting table
-- Run this in Supabase SQL Editor

-- System settings table for platform-wide configuration
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can read/write system settings
CREATE POLICY "Admins can read system settings" ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update system settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can insert system settings" ON system_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Insert default simulation mode setting (off by default)
INSERT INTO system_settings (key, value)
VALUES ('simulation_mode', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add is_simulated flag to donations table
ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT FALSE;

-- Add index for filtering simulated donations
CREATE INDEX IF NOT EXISTS idx_donations_is_simulated ON donations(is_simulated);
