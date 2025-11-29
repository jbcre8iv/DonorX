-- Migration: Add saved donation templates
-- Allows users to save and reuse donation allocation configurations

-- Donation templates table
CREATE TABLE IF NOT EXISTS donation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  amount_cents INTEGER, -- Optional: saved donation amount
  frequency VARCHAR(20), -- Optional: 'one-time', 'monthly', 'quarterly', 'yearly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template allocations (the items within each template)
CREATE TABLE IF NOT EXISTS donation_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES donation_templates(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('nonprofit', 'category')),
  target_id UUID NOT NULL, -- References either nonprofits.id or categories.id
  target_name VARCHAR(255) NOT NULL, -- Cached name for display
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE donation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_template_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donation_templates
CREATE POLICY "Users can view own templates" ON donation_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON donation_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON donation_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON donation_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for donation_template_items (access through template ownership)
CREATE POLICY "Users can view own template items" ON donation_template_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM donation_templates
      WHERE donation_templates.id = donation_template_items.template_id
      AND donation_templates.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own template items" ON donation_template_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM donation_templates
      WHERE donation_templates.id = donation_template_items.template_id
      AND donation_templates.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own template items" ON donation_template_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM donation_templates
      WHERE donation_templates.id = donation_template_items.template_id
      AND donation_templates.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own template items" ON donation_template_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM donation_templates
      WHERE donation_templates.id = donation_template_items.template_id
      AND donation_templates.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_donation_templates_user_id ON donation_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_template_items_template_id ON donation_template_items(template_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donation_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_donation_templates_timestamp ON donation_templates;
CREATE TRIGGER update_donation_templates_timestamp
  BEFORE UPDATE ON donation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_donation_template_timestamp();
