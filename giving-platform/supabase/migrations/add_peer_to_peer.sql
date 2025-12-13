-- Phase 4: Peer-to-Peer Fundraising
-- Personal fundraiser pages, teams, and leaderboards

-- Fundraiser teams (optional grouping for team competitions)
CREATE TABLE fundraiser_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Team info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,

  -- Goals and progress
  goal_cents INTEGER NOT NULL DEFAULT 0,
  raised_cents INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,

  -- Team captain
  captain_user_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, slug)
);

-- Individual fundraisers
CREATE TABLE fundraisers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES fundraiser_teams(id) ON DELETE SET NULL,

  -- Fundraiser page info
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  story TEXT,
  cover_image_url TEXT,

  -- Goals and progress
  personal_goal_cents INTEGER NOT NULL DEFAULT 0,
  raised_cents INTEGER DEFAULT 0,
  donation_count INTEGER DEFAULT 0,

  -- Display settings
  show_on_leaderboard BOOLEAN DEFAULT TRUE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, slug),
  UNIQUE(campaign_id, user_id) -- One fundraiser per user per campaign
);

-- Add fundraiser_id to campaign_donations (linking donations to fundraisers)
ALTER TABLE campaign_donations
ADD COLUMN fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_fundraiser_teams_campaign ON fundraiser_teams(campaign_id);
CREATE INDEX idx_fundraiser_teams_captain ON fundraiser_teams(captain_user_id);
CREATE INDEX idx_fundraisers_campaign ON fundraisers(campaign_id);
CREATE INDEX idx_fundraisers_user ON fundraisers(user_id);
CREATE INDEX idx_fundraisers_team ON fundraisers(team_id);
CREATE INDEX idx_fundraisers_raised ON fundraisers(raised_cents DESC);
CREATE INDEX idx_campaign_donations_fundraiser ON campaign_donations(fundraiser_id);

-- Enable RLS
ALTER TABLE fundraiser_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fundraiser_teams

-- Anyone can view teams for active campaigns
CREATE POLICY "Anyone can view fundraiser teams"
  ON fundraiser_teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = fundraiser_teams.campaign_id
      AND campaigns.status IN ('active', 'ended')
    )
  );

-- Team captains can update their team
CREATE POLICY "Team captains can update their team"
  ON fundraiser_teams FOR UPDATE
  USING (captain_user_id = auth.uid());

-- Authenticated users can create teams for campaigns that allow P2P
CREATE POLICY "Users can create teams"
  ON fundraiser_teams FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_id
      AND campaigns.allow_peer_fundraising = TRUE
      AND campaigns.status = 'active'
    )
  );

-- Admins can manage all teams
CREATE POLICY "Admins can manage all teams"
  ON fundraiser_teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for fundraisers

-- Anyone can view active fundraisers
CREATE POLICY "Anyone can view fundraisers"
  ON fundraisers FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = fundraisers.campaign_id
      AND campaigns.status IN ('active', 'ended')
    )
  );

-- Users can manage their own fundraiser
CREATE POLICY "Users can manage their own fundraiser"
  ON fundraisers FOR ALL
  USING (user_id = auth.uid());

-- Authenticated users can create fundraisers for campaigns that allow P2P
CREATE POLICY "Users can create fundraisers"
  ON fundraisers FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_id
      AND campaigns.allow_peer_fundraising = TRUE
      AND campaigns.status = 'active'
    )
  );

-- Admins can manage all fundraisers
CREATE POLICY "Admins can manage all fundraisers"
  ON fundraisers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Function to update fundraiser totals when a campaign donation is linked
CREATE OR REPLACE FUNCTION update_fundraiser_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' AND NEW.fundraiser_id IS NOT NULL THEN
    UPDATE fundraisers
    SET
      raised_cents = raised_cents + (
        SELECT COALESCE(amount_cents, 0)
        FROM donations
        WHERE id = NEW.donation_id
      ),
      donation_count = donation_count + 1,
      updated_at = NOW()
    WHERE id = NEW.fundraiser_id;

    -- Also update team totals if fundraiser is on a team
    UPDATE fundraiser_teams
    SET
      raised_cents = raised_cents + (
        SELECT COALESCE(amount_cents, 0)
        FROM donations
        WHERE id = NEW.donation_id
      ),
      updated_at = NOW()
    WHERE id = (SELECT team_id FROM fundraisers WHERE id = NEW.fundraiser_id);

    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' AND OLD.fundraiser_id IS NOT NULL THEN
    UPDATE fundraisers
    SET
      raised_cents = raised_cents - (
        SELECT COALESCE(amount_cents, 0)
        FROM donations
        WHERE id = OLD.donation_id
      ),
      donation_count = donation_count - 1,
      updated_at = NOW()
    WHERE id = OLD.fundraiser_id;

    -- Also update team totals
    UPDATE fundraiser_teams
    SET
      raised_cents = raised_cents - (
        SELECT COALESCE(amount_cents, 0)
        FROM donations
        WHERE id = OLD.donation_id
      ),
      updated_at = NOW()
    WHERE id = (SELECT team_id FROM fundraisers WHERE id = OLD.fundraiser_id);

    RETURN OLD;
  END IF;

  -- Handle UPDATE (fundraiser_id changed)
  IF TG_OP = 'UPDATE' THEN
    -- Decrement old fundraiser
    IF OLD.fundraiser_id IS NOT NULL AND OLD.fundraiser_id != NEW.fundraiser_id THEN
      UPDATE fundraisers
      SET
        raised_cents = raised_cents - (
          SELECT COALESCE(amount_cents, 0)
          FROM donations
          WHERE id = OLD.donation_id
        ),
        donation_count = donation_count - 1,
        updated_at = NOW()
      WHERE id = OLD.fundraiser_id;
    END IF;

    -- Increment new fundraiser
    IF NEW.fundraiser_id IS NOT NULL AND (OLD.fundraiser_id IS NULL OR OLD.fundraiser_id != NEW.fundraiser_id) THEN
      UPDATE fundraisers
      SET
        raised_cents = raised_cents + (
          SELECT COALESCE(amount_cents, 0)
          FROM donations
          WHERE id = NEW.donation_id
        ),
        donation_count = donation_count + 1,
        updated_at = NOW()
      WHERE id = NEW.fundraiser_id;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for fundraiser totals
CREATE TRIGGER trigger_update_fundraiser_totals
  AFTER INSERT OR UPDATE OR DELETE ON campaign_donations
  FOR EACH ROW
  EXECUTE FUNCTION update_fundraiser_totals();

-- Function to update team member count
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.team_id IS NOT NULL THEN
    UPDATE fundraiser_teams
    SET member_count = member_count + 1, updated_at = NOW()
    WHERE id = NEW.team_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.team_id IS NOT NULL THEN
    UPDATE fundraiser_teams
    SET member_count = member_count - 1, updated_at = NOW()
    WHERE id = OLD.team_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.team_id IS NOT NULL AND OLD.team_id != NEW.team_id THEN
      UPDATE fundraiser_teams
      SET member_count = member_count - 1, updated_at = NOW()
      WHERE id = OLD.team_id;
    END IF;
    IF NEW.team_id IS NOT NULL AND (OLD.team_id IS NULL OR OLD.team_id != NEW.team_id) THEN
      UPDATE fundraiser_teams
      SET member_count = member_count + 1, updated_at = NOW()
      WHERE id = NEW.team_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for team member count
CREATE TRIGGER trigger_update_team_member_count
  AFTER INSERT OR UPDATE OR DELETE ON fundraisers
  FOR EACH ROW
  EXECUTE FUNCTION update_team_member_count();
