-- Migration: Add Widget Tokens for Embeddable Donation Widgets
-- This allows nonprofits to embed donation forms on their own websites

-- Widget tokens table
CREATE TABLE widget_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT TRUE,

  -- Customization options
  primary_color VARCHAR(7) DEFAULT '#059669', -- emerald-600
  button_text VARCHAR(50) DEFAULT 'Donate Now',
  show_cover_fees BOOLEAN DEFAULT TRUE,
  show_anonymous BOOLEAN DEFAULT TRUE,
  show_dedications BOOLEAN DEFAULT TRUE,
  preset_amounts INTEGER[] DEFAULT ARRAY[2500, 5000, 10000, 25000]::INTEGER[], -- in cents
  allow_custom_amount BOOLEAN DEFAULT TRUE,
  min_amount_cents INTEGER DEFAULT 500, -- $5 minimum

  -- Analytics
  total_donations INTEGER DEFAULT 0,
  total_raised_cents BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX idx_widget_tokens_token ON widget_tokens(token) WHERE is_active = TRUE;
CREATE INDEX idx_widget_tokens_nonprofit ON widget_tokens(nonprofit_id);

-- Enable RLS
ALTER TABLE widget_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for widget_tokens
-- Admins can manage all widget tokens
CREATE POLICY "Admins can manage widget tokens"
  ON widget_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Public can read active widget tokens (needed for widget to work)
CREATE POLICY "Anyone can read active widget tokens"
  ON widget_tokens FOR SELECT
  USING (is_active = TRUE);

-- Future: Nonprofit users can manage their own tokens
-- This will be enabled when nonprofit portal is implemented
-- CREATE POLICY "Nonprofit users can manage their tokens"
--   ON widget_tokens FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM nonprofit_users
--       WHERE nonprofit_users.nonprofit_id = widget_tokens.nonprofit_id
--       AND nonprofit_users.user_id = auth.uid()
--       AND nonprofit_users.role IN ('admin', 'editor')
--     )
--   );

-- Function to generate secure token
CREATE OR REPLACE FUNCTION generate_widget_token()
RETURNS VARCHAR(64) AS $$
DECLARE
  new_token VARCHAR(64);
BEGIN
  -- Generate a cryptographically secure random token
  new_token := encode(gen_random_bytes(32), 'hex');
  RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate token on insert
CREATE OR REPLACE FUNCTION set_widget_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := generate_widget_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER widget_token_auto_generate
  BEFORE INSERT ON widget_tokens
  FOR EACH ROW
  EXECUTE FUNCTION set_widget_token();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_widget_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER widget_token_updated_at
  BEFORE UPDATE ON widget_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_token_timestamp();

-- Function to update widget stats after donation
CREATE OR REPLACE FUNCTION update_widget_stats()
RETURNS TRIGGER AS $$
DECLARE
  widget_token_id UUID;
BEGIN
  -- Check if this donation has a widget_token_id in metadata
  -- This will be set by the widget donation flow
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get widget token from donation notes (stored as JSON)
    IF NEW.notes IS NOT NULL AND NEW.notes::jsonb ? 'widget_token_id' THEN
      widget_token_id := (NEW.notes::jsonb->>'widget_token_id')::UUID;

      UPDATE widget_tokens
      SET
        total_donations = total_donations + 1,
        total_raised_cents = total_raised_cents + NEW.amount_cents + COALESCE(NEW.fee_amount_cents, 0)
      WHERE id = widget_token_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger should be added after testing the basic widget flow
-- CREATE TRIGGER update_widget_stats_on_donation
--   AFTER UPDATE ON donations
--   FOR EACH ROW
--   EXECUTE FUNCTION update_widget_stats();
