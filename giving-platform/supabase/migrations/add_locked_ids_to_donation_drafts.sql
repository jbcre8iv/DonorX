-- Migration: Add locked_ids column to donation_drafts
-- Stores IDs of allocations that are locked from auto-balance

ALTER TABLE donation_drafts
ADD COLUMN IF NOT EXISTS locked_ids JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN donation_drafts.locked_ids IS 'JSON array of target IDs that are locked from auto-balance adjustments';
