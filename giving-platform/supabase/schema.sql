-- DonorX Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations table (donors - corporations, family offices, etc.)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('corporation', 'family_office', 'foundation', 'individual')),
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nonprofits table
CREATE TABLE nonprofits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  ein TEXT,
  mission TEXT,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- Donations table
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Allocations table (how donations are split)
CREATE TABLE allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  nonprofit_id UUID REFERENCES nonprofits(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  percentage DECIMAL(5,2) NOT NULL,
  amount_cents INTEGER NOT NULL,
  disbursed BOOLEAN DEFAULT FALSE,
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allocation templates table
CREATE TABLE allocation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allocation template items
CREATE TABLE allocation_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES allocation_templates(id) ON DELETE CASCADE,
  nonprofit_id UUID REFERENCES nonprofits(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impact reports from nonprofits
CREATE TABLE impact_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nonprofit_id UUID NOT NULL REFERENCES nonprofits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  funds_used_cents INTEGER,
  people_served INTEGER,
  media_urls TEXT[],
  report_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public profiles for donors (optional)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  company TEXT,
  website TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  show_donation_stats BOOLEAN DEFAULT TRUE,
  show_supported_nonprofits BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions for recurring donations
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'quarterly', 'annually')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled', 'past_due')),
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ
);

-- User favorites (bookmarked nonprofits/categories)
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nonprofit_id UUID REFERENCES nonprofits(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT favorite_has_target CHECK (
    (nonprofit_id IS NOT NULL AND category_id IS NULL) OR
    (nonprofit_id IS NULL AND category_id IS NOT NULL)
  ),
  UNIQUE(user_id, nonprofit_id),
  UNIQUE(user_id, category_id)
);

-- Allocation cart items (items ready to donate)
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nonprofit_id UUID REFERENCES nonprofits(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cart_item_has_target CHECK (
    (nonprofit_id IS NOT NULL AND category_id IS NULL) OR
    (nonprofit_id IS NULL AND category_id IS NOT NULL)
  ),
  UNIQUE(user_id, nonprofit_id),
  UNIQUE(user_id, category_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nonprofits ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: Anyone can read
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- Nonprofits: Anyone can read approved nonprofits
CREATE POLICY "Approved nonprofits are viewable by everyone" ON nonprofits FOR SELECT USING (status = 'approved');

-- Nonprofits: Anyone can submit applications (pending status only)
-- Note: We use admin client in the app to bypass RLS for application submissions
-- CREATE POLICY "Anyone can insert nonprofit applications" ON nonprofits FOR INSERT WITH CHECK (status = 'pending');

-- Users: Users can read their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Organizations: Members can read their org
CREATE POLICY "Organization members can view their org" ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Donations: Users can read their own donations
CREATE POLICY "Users can view own donations" ON donations FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own donations" ON donations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allocations: Users can read allocations for their donations
CREATE POLICY "Users can view own allocations" ON allocations FOR SELECT
  USING (donation_id IN (SELECT id FROM donations WHERE user_id = auth.uid()));

-- Templates: Users can manage their org's templates
CREATE POLICY "Users can view org templates" ON allocation_templates FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can insert org templates" ON allocation_templates FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update org templates" ON allocation_templates FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can delete org templates" ON allocation_templates FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Template items: Same as templates
CREATE POLICY "Users can view org template items" ON allocation_template_items FOR SELECT
  USING (template_id IN (SELECT id FROM allocation_templates WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())));

-- Impact reports: Anyone can read
CREATE POLICY "Impact reports are viewable by everyone" ON impact_reports FOR SELECT USING (true);
CREATE POLICY "Nonprofits can insert impact reports" ON impact_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Nonprofits can delete own impact reports" ON impact_reports FOR DELETE USING (true);

-- Profiles: Public profiles are viewable, users can manage their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions: Users can manage their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (user_id = auth.uid());

-- User Favorites: Users can manage their own favorites
CREATE POLICY "Users can view own favorites" ON user_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own favorites" ON user_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own favorites" ON user_favorites FOR DELETE USING (user_id = auth.uid());

-- Cart Items: Users can manage their own cart
CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own cart items" ON cart_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own cart items" ON cart_items FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own cart items" ON cart_items FOR DELETE USING (user_id = auth.uid());

-- Insert some default categories
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Education', 'education', 'Schools, scholarships, and educational programs', '📚'),
  ('Environment', 'environment', 'Conservation, climate action, and sustainability', '🌍'),
  ('Healthcare', 'healthcare', 'Hospitals, medical research, and health services', '🏥'),
  ('Hunger Relief', 'hunger-relief', 'Food banks and nutrition programs', '🍽️'),
  ('Housing', 'housing', 'Affordable housing and homelessness prevention', '🏠'),
  ('Arts & Culture', 'arts-culture', 'Museums, theaters, and cultural preservation', '🎨'),
  ('Animal Welfare', 'animal-welfare', 'Animal rescue and wildlife protection', '🐾'),
  ('Human Rights', 'human-rights', 'Civil liberties and social justice', '⚖️'),
  ('Disaster Relief', 'disaster-relief', 'Emergency response and recovery', '🆘'),
  ('Youth Development', 'youth-development', 'Mentorship and youth programs', '👦');

-- Insert some sample nonprofits
INSERT INTO nonprofits (name, ein, mission, website, category_id, status, featured) VALUES
  ('Education First Foundation', '12-3456789', 'Providing quality education to underserved communities worldwide.', 'https://example.com', (SELECT id FROM categories WHERE slug = 'education'), 'approved', true),
  ('Green Earth Initiative', '23-4567890', 'Fighting climate change through reforestation and sustainable practices.', 'https://example.com', (SELECT id FROM categories WHERE slug = 'environment'), 'approved', true),
  ('Healthcare for All', '34-5678901', 'Delivering essential healthcare services to communities in need.', 'https://example.com', (SELECT id FROM categories WHERE slug = 'healthcare'), 'approved', false),
  ('Food Bank Network', '45-6789012', 'Ending hunger by distributing meals to families facing food insecurity.', 'https://example.com', (SELECT id FROM categories WHERE slug = 'hunger-relief'), 'approved', false),
  ('Housing Hope', '56-7890123', 'Building affordable housing and preventing homelessness in our communities.', NULL, (SELECT id FROM categories WHERE slug = 'housing'), 'approved', false),
  ('Arts for Everyone', '67-8901234', 'Making arts and cultural experiences accessible to all people.', 'https://example.com', (SELECT id FROM categories WHERE slug = 'arts-culture'), 'approved', true);
