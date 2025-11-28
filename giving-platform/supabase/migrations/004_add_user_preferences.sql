-- Add user preferences column to profiles table
-- This stores user settings as JSONB for flexibility

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON profiles USING GIN (preferences);

-- Comment for documentation
COMMENT ON COLUMN profiles.preferences IS 'User preferences stored as JSONB. Includes: directory_view_mode (grid|table), etc.';
