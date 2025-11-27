-- Migration: Split full_name into first_name and last_name
-- Run this in the Supabase SQL Editor

-- Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing data (split full_name into first and last)
UPDATE users
SET
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = CASE
    WHEN POSITION(' ' IN full_name) > 0
    THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
    ELSE NULL
  END
WHERE full_name IS NOT NULL;

-- Optionally drop the old column (do this after verifying the migration worked)
-- ALTER TABLE users DROP COLUMN full_name;
