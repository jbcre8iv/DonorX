-- Migration: Add is_locked column to donation_template_items
-- Stores whether each template item should be locked from auto-balance when loaded

ALTER TABLE donation_template_items
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN donation_template_items.is_locked IS 'Whether this item should be locked from auto-balance adjustments when template is loaded';
