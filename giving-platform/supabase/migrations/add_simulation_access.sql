-- Add simulation_access column to users table
-- This allows owners to grant simulation access to specific users
-- Admins automatically have simulation access

ALTER TABLE users ADD COLUMN IF NOT EXISTS simulation_access BOOLEAN DEFAULT FALSE;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_simulation_access ON users(simulation_access);
