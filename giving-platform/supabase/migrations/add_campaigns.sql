-- Phase 3: Campaign Pages
-- Time-limited fundraising campaigns with goals, deadlines, and progress tracking

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE CASCADE,

  -- Basic info
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  cover_image_url TEXT,

  -- Goals and progress
  goal_cents INTEGER NOT NULL,
  raised_cents INTEGER DEFAULT 0,
  donation_count INTEGER DEFAULT 0,

  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Status: draft, active, ended, cancelled
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),

  -- Settings
  allow_peer_fundraising BOOLEAN DEFAULT FALSE,
  show_donor_names BOOLEAN DEFAULT TRUE,
  show_donor_amounts BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign donations junction table
-- Links donations to campaigns (fundraiser_id will be added in Phase 4)
CREATE TABLE campaign_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,

  -- Optional donor message/comment for this campaign
  donor_comment TEXT,
  donor_display_name VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, donation_id)
);

-- Indexes for performance
CREATE INDEX idx_campaigns_nonprofit ON campaigns(nonprofit_id);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_featured ON campaigns(featured) WHERE featured = TRUE;
CREATE INDEX idx_campaign_donations_campaign ON campaign_donations(campaign_id);
CREATE INDEX idx_campaign_donations_donation ON campaign_donations(donation_id);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns

-- Anyone can view active/ended campaigns
CREATE POLICY "Anyone can view public campaigns"
  ON campaigns FOR SELECT
  USING (status IN ('active', 'ended'));

-- Admins can do everything
CREATE POLICY "Admins can manage all campaigns"
  ON campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Nonprofit users can manage their own campaigns
CREATE POLICY "Nonprofit users can manage their campaigns"
  ON campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nonprofit_users
      WHERE nonprofit_users.user_id = auth.uid()
      AND nonprofit_users.nonprofit_id = campaigns.nonprofit_id
      AND nonprofit_users.role IN ('admin', 'editor')
    )
  );

-- RLS Policies for campaign_donations

-- Anyone can view campaign donations (for donor rolls)
CREATE POLICY "Anyone can view campaign donations"
  ON campaign_donations FOR SELECT
  USING (TRUE);

-- System/admins can insert campaign donations
CREATE POLICY "System can insert campaign donations"
  ON campaign_donations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
    OR auth.uid() IS NULL -- Allow service role
  );

-- Function to update campaign totals when a donation is linked
CREATE OR REPLACE FUNCTION update_campaign_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the donation amount
    UPDATE campaigns
    SET
      raised_cents = raised_cents + (
        SELECT COALESCE(amount_cents, 0)
        FROM donations
        WHERE id = NEW.donation_id
      ),
      donation_count = donation_count + 1,
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE campaigns
    SET
      raised_cents = raised_cents - (
        SELECT COALESCE(amount_cents, 0)
        FROM donations
        WHERE id = OLD.donation_id
      ),
      donation_count = donation_count - 1,
      updated_at = NOW()
    WHERE id = OLD.campaign_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update campaign totals
CREATE TRIGGER trigger_update_campaign_totals
  AFTER INSERT OR DELETE ON campaign_donations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_totals();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_campaign_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := substring(base_slug, 1, 80);

  final_slug := base_slug;

  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM campaigns WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-end expired campaigns
CREATE OR REPLACE FUNCTION auto_end_expired_campaigns()
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET status = 'ended', updated_at = NOW()
  WHERE status = 'active'
  AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;
