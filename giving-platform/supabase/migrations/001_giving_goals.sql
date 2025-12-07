-- Create giving_goals table for tracking yearly giving goals
CREATE TABLE giving_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  goal_cents BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- Enable RLS
ALTER TABLE giving_goals ENABLE ROW LEVEL SECURITY;

-- Users can view their own goals
CREATE POLICY "Users can view own goals" ON giving_goals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own goals
CREATE POLICY "Users can insert own goals" ON giving_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own goals
CREATE POLICY "Users can update own goals" ON giving_goals
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_giving_goals_user_year ON giving_goals(user_id, year);

-- Migrate existing goals from users table to giving_goals
-- This will copy any existing giving_goal_cents to the new table for 2025
INSERT INTO giving_goals (user_id, year, goal_cents)
SELECT id, 2025, giving_goal_cents
FROM users
WHERE giving_goal_cents IS NOT NULL AND giving_goal_cents > 0
ON CONFLICT (user_id, year) DO NOTHING;
