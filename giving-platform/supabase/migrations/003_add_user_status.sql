-- Add status column to users table for approval workflow
-- New users start as 'pending' and must be approved by an owner

-- Add status column (default to 'approved' for existing users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add approved_at timestamp
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add approved_by column to track who approved the user
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update existing users to be approved (they were already in the system)
UPDATE users SET status = 'approved', approved_at = created_at WHERE status IS NULL;

-- Create index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
