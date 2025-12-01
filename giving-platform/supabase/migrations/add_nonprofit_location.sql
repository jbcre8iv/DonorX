-- Add location fields to nonprofits table
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE nonprofits ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_nonprofits_city ON nonprofits(city);
CREATE INDEX IF NOT EXISTS idx_nonprofits_state ON nonprofits(state);
CREATE INDEX IF NOT EXISTS idx_nonprofits_zip_code ON nonprofits(zip_code);
