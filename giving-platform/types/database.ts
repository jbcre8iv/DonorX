export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  type: "corporation" | "family_office" | "foundation" | "individual";
  logo_url: string | null;
  website: string | null;
  created_at: string;
};

export type User = {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  created_at: string;
};

export type Nonprofit = {
  id: string;
  name: string;
  ein: string | null;
  mission: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  category_id: string | null;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  fundraising_goal_cents?: number | null;
  total_raised_cents?: number;
  created_at: string;
  approved_at: string | null;
  category?: Category;
};

export type RecurringInterval = "monthly" | "quarterly" | "annually";

export type Donation = {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_subscription_id: string | null;
  is_recurring: boolean;
  recurring_interval: RecurringInterval | null;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  receipt_url: string | null;
  notes: string | null;
  cover_fees?: boolean;
  fee_amount_cents?: number;
  is_anonymous?: boolean;
  created_at: string;
  completed_at: string | null;
};

export type Subscription = {
  id: string;
  user_id: string;
  organization_id: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  amount_cents: number;
  interval: RecurringInterval;
  status: "active" | "paused" | "canceled" | "past_due";
  current_period_start: string;
  current_period_end: string;
  canceled_at: string | null;
  created_at: string;
};

export type Allocation = {
  id: string;
  donation_id: string;
  nonprofit_id: string | null;
  category_id: string | null;
  percentage: number;
  amount_cents: number;
  disbursed: boolean;
  disbursed_at: string | null;
  created_at: string;
  nonprofit?: Nonprofit;
  category?: Category;
};

export type AllocationTemplate = {
  id: string;
  organization_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  items?: AllocationTemplateItem[];
};

export type AllocationTemplateItem = {
  id: string;
  template_id: string;
  nonprofit_id: string | null;
  category_id: string | null;
  percentage: number;
  created_at: string;
};

export type ImpactReport = {
  id: string;
  nonprofit_id: string;
  title: string;
  content: string | null;
  funds_used_cents: number | null;
  people_served: number | null;
  media_urls: string[] | null;
  report_date: string | null;
  created_at: string;
};

export type DedicationType = "in_honor_of" | "in_memory_of";

export type GiftDedication = {
  id: string;
  donation_id: string;
  dedication_type: DedicationType;
  honoree_name: string;
  notification_email: string | null;
  notification_name: string | null;
  personal_message: string | null;
  send_notification: boolean;
  notification_sent_at: string | null;
  created_at: string;
};
