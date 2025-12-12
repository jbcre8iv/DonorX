-- Quick Win Features Migration
-- Adds: cover fees, anonymous giving, gift dedications, nonprofit fundraising goals

-- 1. Add cover fees and anonymous giving columns to donations
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS cover_fees BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fee_amount_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- 2. Add fundraising goal columns to nonprofits
ALTER TABLE nonprofits
ADD COLUMN IF NOT EXISTS fundraising_goal_cents INTEGER,
ADD COLUMN IF NOT EXISTS total_raised_cents INTEGER DEFAULT 0;

-- 3. Create gift dedications table
CREATE TABLE IF NOT EXISTS gift_dedications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  dedication_type VARCHAR(20) NOT NULL CHECK (dedication_type IN ('in_honor_of', 'in_memory_of')),
  honoree_name VARCHAR(255) NOT NULL,
  notification_email VARCHAR(255),
  notification_name VARCHAR(255),
  personal_message TEXT,
  send_notification BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on gift_dedications
ALTER TABLE gift_dedications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gift_dedications
-- Users can view their own dedications
CREATE POLICY "Users can view own gift dedications" ON gift_dedications
  FOR SELECT USING (
    donation_id IN (SELECT id FROM donations WHERE user_id = auth.uid())
  );

-- Users can insert dedications for their own donations
CREATE POLICY "Users can insert own gift dedications" ON gift_dedications
  FOR INSERT WITH CHECK (
    donation_id IN (SELECT id FROM donations WHERE user_id = auth.uid())
  );

-- Admins can view all dedications
CREATE POLICY "Admins can view all gift dedications" ON gift_dedications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Admins can manage all dedications
CREATE POLICY "Admins can manage all gift dedications" ON gift_dedications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_gift_dedications_donation_id ON gift_dedications(donation_id);

-- 4. Create trigger to update nonprofit total_raised_cents when donations complete
CREATE OR REPLACE FUNCTION update_nonprofit_total_raised()
RETURNS TRIGGER AS $$
BEGIN
  -- When a donation is marked as completed, update nonprofit totals
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE nonprofits np
    SET total_raised_cents = (
      SELECT COALESCE(SUM(a.amount_cents), 0)
      FROM allocations a
      JOIN donations d ON d.id = a.donation_id
      WHERE a.nonprofit_id = np.id
      AND d.status = 'completed'
    )
    WHERE np.id IN (
      SELECT nonprofit_id FROM allocations WHERE donation_id = NEW.id AND nonprofit_id IS NOT NULL
    );
  END IF;

  -- Handle refunds - subtract from total
  IF NEW.status = 'refunded' AND OLD.status = 'completed' THEN
    UPDATE nonprofits np
    SET total_raised_cents = (
      SELECT COALESCE(SUM(a.amount_cents), 0)
      FROM allocations a
      JOIN donations d ON d.id = a.donation_id
      WHERE a.nonprofit_id = np.id
      AND d.status = 'completed'
    )
    WHERE np.id IN (
      SELECT nonprofit_id FROM allocations WHERE donation_id = NEW.id AND nonprofit_id IS NOT NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on donations table
DROP TRIGGER IF EXISTS update_nonprofit_totals_trigger ON donations;
CREATE TRIGGER update_nonprofit_totals_trigger
  AFTER UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_nonprofit_total_raised();

-- 5. Backfill existing nonprofit totals from completed donations
UPDATE nonprofits np
SET total_raised_cents = (
  SELECT COALESCE(SUM(a.amount_cents), 0)
  FROM allocations a
  JOIN donations d ON d.id = a.donation_id
  WHERE a.nonprofit_id = np.id
  AND d.status = 'completed'
);
