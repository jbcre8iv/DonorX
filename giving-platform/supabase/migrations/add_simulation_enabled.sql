-- Add simulation_enabled column to users table
-- This is the user's personal simulation on/off preference (separate from simulation_access which is permission)

ALTER TABLE users ADD COLUMN IF NOT EXISTS simulation_enabled BOOLEAN DEFAULT FALSE;
