-- Migration: Add donation drafts table
-- Stores in-progress donation configurations for cross-device access

-- Donation drafts table (one per user, auto-updated)
CREATE TABLE IF NOT EXISTS donation_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 10000,
  frequency VARCHAR(20) NOT NULL DEFAULT 'one-time',
  allocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE donation_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own draft" ON donation_drafts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own draft" ON donation_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own draft" ON donation_drafts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own draft" ON donation_drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_donation_drafts_user_id ON donation_drafts(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donation_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_donation_drafts_timestamp ON donation_drafts;
CREATE TRIGGER update_donation_drafts_timestamp
  BEFORE UPDATE ON donation_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_donation_draft_timestamp();

-- Add to realtime publication for cross-device sync
ALTER PUBLICATION supabase_realtime ADD TABLE donation_drafts;
