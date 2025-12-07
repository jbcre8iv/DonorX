-- Add recurring donation fields to donations table
-- Run this in Supabase SQL Editor

-- Add is_recurring flag
ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add recurring_interval for tracking donation frequency
ALTER TABLE donations ADD COLUMN IF NOT EXISTS recurring_interval TEXT CHECK (recurring_interval IN ('monthly', 'quarterly', 'annually'));

-- Add index for filtering recurring donations
CREATE INDEX IF NOT EXISTS idx_donations_is_recurring ON donations(is_recurring);
